import { enquiryCode } from "@/lib/accountEnquiries";
import { canReadLeadChat, canReadLeads, type ChatThread } from "@/lib/accountLeadInbox";
import { sourcingId as id } from "@/lib/sourcingInterest";
import { accountFlag as flag, accountRecord as record, displayText as text } from "@/lib/userDashboard";

const sorts = { id: "id", enquiry_number: "enquiry_number", product_name: "enquiry_product", quantity: "quantity", created_at: "created_at" };

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function rows(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Invalid enquiry response.");
  return value.map(record);
}

function pick(row: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, text(row[field])]));
}

function leadRow(row: Record<string, unknown>) {
  const sender = record(row.from_user);
  const item = record(Array.isArray(row.enquiry_users) ? row.enquiry_users[0] : row.enquiryUser);
  return {
    ...pick(row, ["id", "enquiry_number", "quantity", "created_at", "category_name", "sub_category_name"]),
    sender: pick(sender, ["full_name", "fname", "lname", "email", "mobile"]),
    company: pick(record(sender.company_info), ["organization_name", "organization_slug"]),
    item: pick(item, ["product_name", "enquiry_status"]),
  };
}

function belongsToSeller(row: Record<string, unknown>, userId: number, companyId: number) {
  const items = Array.isArray(row.enquiry_users) ? row.enquiry_users : [row.enquiryUser];
  return id(row.company_id) === userId && items.some((item) => id(record(item).company_id) === companyId);
}

function chatThread(row: Record<string, unknown>, outgoing: boolean): ChatThread {
  return {
    id: id(row.enquiry_id), number: text(row.enquiry_number),
    name: text(outgoing ? row.organization_name : row.org_name),
    location: text(outgoing ? row.company_location : row.com_location),
    photo: text(outgoing ? row.company_logo : row.company_logo_new),
  };
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return reply({ message: "Please sign in again." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "The enquiry API is unavailable." }, 503);

  const params = new URL(request.url).searchParams;
  const view = params.get("view") ?? "list";
  if (!["list", "export", "counts", "detail", "chats", "messages"].includes(view)) return reply({ message: "Unknown enquiry view." }, 400);
  const chat = view === "chats" || view === "messages";
  const outgoing = chat && params.get("direction") === "outgoing";
  const search = (params.get("search") ?? "").trim();
  // The legacy lead search inserts this term into a SQL literal.
  if (view === "list" && !/^[\p{L}\p{M}\p{N} .@+-]{0,100}$/u.test(search)) {
    return reply({ message: "Search with letters, numbers, spaces, dots, @, + or hyphens." }, 400);
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(25000)]);
  async function upstream(path: string) {
    const response = await fetch(`${base}/${path}`, {
      headers: { Authorization: authorization! }, signal, redirect: "error", cache: "no-store",
    });
    return response;
  }
  async function load(path: string) {
    const response = await upstream(path);
    if (!response.ok) throw new Error("Enquiry API request failed.");
    return record(await response.json());
  }

  try {
    const profile = await upstream("signup/profile");
    if ([401, 403].includes(profile.status)) return reply({ message: "Please sign in again." }, 401);
    if (!profile.ok) throw new Error("Could not verify profile.");
    const user = record(record(await profile.json()).user);
    const userId = id(user.id);
    const companyId = id(user.company_id);
    if (!userId) return reply({ message: "Please sign in again." }, 401);
    const allowed = chat ? canReadLeadChat(user, outgoing) : canReadLeads(user);
    if (!allowed || !companyId) return reply({ message: "This section is unavailable for your account." }, 403);

    if (view === "counts") {
      const result = await load(`enquiries/lead-count?companyId=${companyId}&userId=${userId}`);
      return reply(pick(result, ["totalApproved", "openApproved", "closedApproved"]));
    }

    if (chat) {
      const result = await load(`enquiries/all-leads?companyId=${companyId}&is_type=${outgoing ? "myenquiry" : "mylead"}`);
      const memberships = rows(result.data).filter((row) => {
        const thread = chatThread(row, outgoing);
        return id(row[outgoing ? "buyer_company_id" : "seller_company_id"]) === companyId
          && thread.id && enquiryCode(thread.number) && id(row.enquiry_message_id ?? row.id);
      });
      if (view === "chats") {
        const threads = new Map<number, ChatThread>();
        for (const row of memberships) {
          const thread = chatThread(row, outgoing);
          if (!threads.has(thread.id)) threads.set(thread.id, thread);
        }
        return reply([...threads.values()]);
      }

      const enquiryId = id(params.get("id"));
      const matching = memberships.filter((row) => id(row.enquiry_id) === enquiryId);
      if (!matching.length) return reply({ message: "Conversation not found." }, 404);
      const messageIds = new Set(matching.map((row) => id(row.enquiry_message_id ?? row.id)));
      const participantCompanies = new Set(matching.flatMap((row) => [id(row.buyer_company_id), id(row.seller_company_id)]).filter(Boolean));
      const conversation = await load(`enquiries/messages?enq_id=${enquiryId}`);
      const enquiry = record(conversation.enquiry);
      if (id(enquiry.id) !== enquiryId || flag(enquiry.is_delete) || !flag(enquiry.is_approve)) {
        return reply({ message: "Conversation not found." }, 404);
      }
      const messages = new Map<number, { id: string; message: string; date: string; name: string; mine: boolean }>();
      for (const row of rows(conversation.data)) {
        const messageId = id(row.user_message_id ?? row.id);
        const authorCompany = id(row.company_id) || (id(row.user_id) === id(enquiry.user_id) ? id(enquiry.buyer_company_id) : 0);
        if (!messageId || !messageIds.has(id(row.mid)) || !participantCompanies.has(authorCompany)) continue;
        if (!messages.has(messageId)) messages.set(messageId, {
          id: String(messageId), message: text(row.message), date: text(row.updated_at ?? row.created_at),
          name: [text(row.user_fname), text(row.user_lname)].filter(Boolean).join(" "),
          mine: authorCompany === companyId,
        });
      }
      return reply([...messages.values()]);
    }

    if (view === "detail") {
      const number = params.get("number") ?? "";
      if (!enquiryCode(number)) return reply({ message: "Lead not found." }, 404);
      const response = await upstream(`enquiries/${encodeURIComponent(number)}`);
      if (response.status === 404) return reply({ message: "Lead not found." }, 404);
      if (!response.ok) throw new Error("Lead unavailable.");
      const row = record(await response.json());
      if (!id(row.id) || !belongsToSeller(row, userId, companyId) || flag(row.is_delete) || !flag(row.is_approve)) {
        return reply({ message: "Lead not found." }, 404);
      }
      const product = record(row.product_details);
      return reply({
        ...leadRow(row), ...pick(row, ["description", "from_email", "from_mobile", "from_full_name", "from_organization_name", "from_organization_slug", "from_activity_name", "from_core_activity_name"]),
        product: { ...pick(product, ["title", "slug"]), category: text(record(product.Categories).name),
          subcategory: text(record(product.SubCategories).name), company: text(record(product.company_info).organization_name) },
      });
    }

    // Legacy lead creation stores the product owner user ID in enquiries.company_id.
    const query = new URLSearchParams({ type: "lead", user_id: String(userId) });
    if (view === "export") query.set("all", "true");
    else {
      const sort = params.get("sortBy");
      query.set("sortBy", sort && Object.hasOwn(sorts, sort) ? sorts[sort as keyof typeof sorts] : "id");
      query.set("sort", params.get("sort") === "ASC" ? "ASC" : "DESC");
      query.set("search", search);
      query.set("page", String(Math.min(id(params.get("page")) || 1, 100000)));
      query.set("limit", String(Math.min(id(params.get("limit")) || 25, 100)));
    }
    const result = await load(`enquiries/by-user?${query}`);
    const data = rows(result.data).filter((row) => belongsToSeller(row, userId, companyId) && !flag(row.is_delete) && flag(row.is_approve));
    return reply({ data: data.map(leadRow), totalRecords: Number(result.totalRecords) || data.length,
      filteredRecords: Number(result.filteredRecords) || data.length });
  } catch {
    return reply({ message: "Enquiries could not be loaded. Please try again." }, 502);
  }
}
