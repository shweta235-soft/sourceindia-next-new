import { enquiryCode, MAX_ENQUIRY_MESSAGE_LENGTH } from "@/lib/accountEnquiries";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";
import { sourcingId as positiveId } from "@/lib/sourcingInterest";

type RecordData = Record<string, unknown>;

function items(value: unknown) {
  return Array.isArray(value) ? value.map(record) : [];
}

function pick(row: RecordData, fields: string[]) {
  return Object.fromEntries(fields.map((key) => [key, text(row[key])]));
}

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

const sortFields = ["id", "enquiry_number", "enquiry_product", "quantity", "created_at"];
const listFields = ["id", "enquiry_number", "quantity", "created_at", "category_name", "sub_category_name"];
const counterFields = ["enquirytotal", "enquiryopen", "enquiryclosed"];

function listRow(row: RecordData) {
  const receiver = record(row.to_user);
  return {
    ...pick(row, listFields),
    receiver: pick(receiver, ["fname", "lname", "full_name", "email"]),
    organization: pick(record(receiver.company_info), ["organization_name", "organization_slug"]),
    item: pick(items(row.enquiry_users)[0] ?? {}, ["product_name", "enquiry_status"]),
  };
}

async function handleEnquiry(request: Request, sending: boolean) {
  const auth = request.headers.get("authorization");
  if (!auth || !/^Bearer \S+$/i.test(auth)) return reply({ message: "Please sign in again." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "Enquiry API is unavailable." }, 503);

  const params = new URL(request.url).searchParams;
  const input = sending ? record(await request.json().catch(() => null)) : {};
  const view = sending ? "detail" : params.get("view") ?? "list";
  const number = sending ? text(input.number) : params.get("number") ?? "";
  const message = sending ? text(input.message).trim() : "";
  if (sending && (typeof input.message !== "string" || !message || message.length > MAX_ENQUIRY_MESSAGE_LENGTH)) {
    return reply({ message: `Enter a message of 1–${MAX_ENQUIRY_MESSAGE_LENGTH} characters.` }, 400);
  }
  if (view === "detail" && !enquiryCode(number)) return reply({ message: "Enquiry not found." }, 404);
  if (!["list", "export", "counts", "detail"].includes(view)) return reply({ message: "Unknown enquiry view." }, 400);
  const term = (params.get("search") ?? "").trim();
  // The legacy server builds a raw text search condition.
  if (view === "list" && !/^[\p{L}\p{M}\p{N} .@+-]{0,100}$/u.test(term)) {
    return reply({ message: "Search with letters, numbers, spaces, dots, @, + or hyphens." }, 400);
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(25000)]);
  const upstream = (path: string, data?: object) => fetch(`${base}/${path}`, {
    method: data ? "POST" : "GET",
    headers: { Authorization: auth, ...(data ? { "Content-Type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store", redirect: "error", signal,
  });

  try {
    const profile = await upstream("signup/profile");
    if ([401, 403].includes(profile.status)) return reply({ message: "Please sign in again." }, 401);
    if (!profile.ok) throw new Error("Could not verify profile.");
    const user = record(record(await profile.json()).user);
    const userId = positiveId(user.id);
    if (!userId) return reply({ message: "Please sign in again." }, 401);

    if (view === "counts") {
      const companyId = positiveId(user.company_id);
      if (!companyId) return reply({ message: "Enquiry counts are unavailable." }, 404);
      const response = await upstream(`enquiries/lead-count?companyId=${companyId}&userId=${userId}`);
      if (!response.ok) throw new Error("Counts unavailable.");
      return reply(pick(record(await response.json()), counterFields));
    }

    if (view === "detail") {
      const response = await upstream(`enquiries/${encodeURIComponent(number)}?myEnquiry=true`);
      if (response.status === 404) return reply({ message: "Enquiry not found." }, 404);
      if (!response.ok) throw new Error("Detail unavailable.");
      const row = record(await response.json());
      const id = positiveId(row.id);
      if (!id || positiveId(row.user_id) !== userId || positiveId(row.is_delete)) {
        return reply({ message: "Enquiry not found." }, 404);
      }
      const approved = positiveId(row.is_approve) === 1;
      const companyId = positiveId(user.company_id);
      if (sending) {
        if (!approved) return reply({ message: "Messages are available after this enquiry is approved." }, 403);
        if (!companyId) return reply({ message: "Complete your company information before sending a message." }, 409);
        try {
          const sent = await upstream("enquiries/send-message", {
            enquiry_id: id, message, user: { id: userId, company_id: companyId },
          });
          const result = record(await sent.json().catch(() => null));
          if (sent.status === 400 && result.message === "No base message found") {
            return reply({ message: "This enquiry does not have a message thread to reply to yet." }, 409);
          }
          if (!sent.ok || result.success !== true) throw new Error("Send could not be confirmed.");
          return reply({ sent: true });
        } catch {
          return reply({ message: "Sending could not be confirmed. Refresh messages before trying again." }, 502);
        }
      }
      const product = record(row.product_details);
      const messagesResponse = await upstream(`enquiries/messages?enq_id=${id}`).catch(() => null);
      const messagesResult = messagesResponse?.ok ? record(await messagesResponse.json().catch(() => null)) : {};
      const messages = Array.isArray(messagesResult.data) ? items(messagesResult.data).map((message) => ({
        ...pick(message, ["id", "message", "updated_at", "user_fname", "user_lname"]),
        mine: positiveId(message.user_id) === userId,
      })) : null;

      return reply({
        ...pick(row, [...listFields, "status", "description", "to_full_name", "to_organization_name", "to_organization_slug",
          "to_activity_name", "to_core_activity_name", "enquiry_product"]),
        ...approved && pick(row, ["to_email", "to_mobile"]),
        canSend: approved && Boolean(companyId),
        item: pick(record(row.enquiryUser ?? items(row.enquiry_users)[0]), ["enquiry_status", "product_name"]),
        product: { ...pick(product, ["title", "slug"]), category: text(record(product.Categories).name),
          subcategory: text(record(product.SubCategories).name), company: text(record(product.company_info).organization_name) },
        messages,
      });
    }

    const query = new URLSearchParams({ user_id: String(userId) });
    if (view === "export") query.set("all", "true");
    else {
      const page = positiveId(params.get("page")) || 1;
      const limit = positiveId(params.get("limit"));
      const sort = params.get("sortBy") ?? "";
      query.set("page", String(Math.min(page, 1000000)));
      query.set("limit", [25, 50, 100].includes(limit) ? String(limit) : "25");
      query.set("sortBy", sortFields.includes(sort) ? sort : "id");
      query.set("sort", params.get("sort") === "ASC" ? "ASC" : "DESC");
      if (term) query.set("search", term);
    }
    const response = await upstream(`enquiries/by-enquiry?${query}`);
    if (!response.ok) throw new Error("List unavailable.");
    const result = record(await response.json());
    if (!Array.isArray(result.data)) throw new Error("Invalid list.");
    const data = items(result.data).filter((row) => positiveId(row.user_id) === userId && !positiveId(row.is_delete)).map(listRow);
    return reply({ data, totalRecords: Number(result.totalRecords) || 0, filteredRecords: Number(result.filteredRecords) || 0 });
  } catch {
    return reply({ message: sending ? "Could not verify this enquiry. The message was not sent." : "Your enquiries could not be loaded. Please try again." }, 502);
  }
}


export function GET(request: Request) {
  return handleEnquiry(request, false);
}

export function POST(request: Request) {
  return handleEnquiry(request, true);
}
