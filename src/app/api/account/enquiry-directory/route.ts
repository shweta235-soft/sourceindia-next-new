import { canBrowseOpenEnquiries, canReadConnects, canReadOwnOpenEnquiries } from "@/lib/accountEnquiryDirectory";
import { openSortFields } from "@/lib/adminEnquiries";
import { sourcingId as id } from "@/lib/sourcingInterest";
import { accountFlag as flag, accountRecord as record, displayText as text } from "@/lib/userDashboard";

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function openRow(row: Record<string, unknown>) {
  return {
    id: id(row.id), name: text(row.name) || [text(row.fname), text(row.lname)].filter(Boolean).join(" "),
    email: text(row.email), title: text(row.title), description: text(row.description),
    created_at: text(row.created_at), updated_at: text(row.updated_at), is_home: flag(row.is_home),
  };
}

function connectRow(row: Record<string, unknown>, userId: number) {
  const sent = id(row.user_id) === userId;
  if (!sent && id(row.reciever_id) !== userId) throw new Error("Unscoped buyer enquiry.");
  const company = record(record(row.receiver).company_info);
  return {
    id: id(row.id), title: text(row.title), message: text(row.message), created_at: text(row.created_at),
    company_name: text(company.organization_name), company_slug: text(company.organization_slug),
    direction: sent ? "send" : "received",
  };
}

function listPayload(value: unknown) {
  const payload = record(value);
  const { data, totalRecords, filteredRecords } = payload;
  if (!Array.isArray(data) || typeof totalRecords !== "number" || typeof filteredRecords !== "number"
    || !Number.isSafeInteger(totalRecords) || totalRecords < 0
    || !Number.isSafeInteger(filteredRecords) || filteredRecords < 0) throw new Error("Invalid enquiry list.");
  return { data: data.map(record), totalRecords, filteredRecords };
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return reply({ message: "Please sign in again." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "The enquiry API is unavailable." }, 503);
  const params = new URL(request.url).searchParams;
  const view = params.get("view");
  const mine = params.get("scope") !== "all";
  if (!["open", "detail", "threads", "export", "connects"].includes(view ?? "")) return reply({ message: "Unknown enquiry view." }, 400);

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(25000)]);
  const upstream = (path: string) => fetch(`${base}/${path}`, {
    headers: { Authorization: authorization }, signal, cache: "no-store", redirect: "error",
  });

  try {
    const profile = await upstream("signup/profile");
    if ([401, 403].includes(profile.status)) return reply({ message: "Please sign in again." }, 401);
    if (!profile.ok) throw new Error("Could not verify profile.");
    const user = record(record(await profile.json()).user);
    const userId = id(user.id);
    if (!userId) return reply({ message: "Please sign in again." }, 401);
    const allowed = view === "connects" ? canReadConnects(user) : mine ? canReadOwnOpenEnquiries(user) : canBrowseOpenEnquiries(user);
    if (!allowed) return reply({ message: "This section is unavailable for your account." }, 403);

    if (view === "connects") {
      // The legacy search replaces its sender/receiver condition. Fetch the scoped list without that parameter.
      const data = [];
      const limit = 100;
      for (let page = 1; ; page++) {
        const response = await upstream(`buyerenquiry/user?user_id=${userId}&page=${page}&limit=${limit}`);
        if (!response.ok) throw new Error("Could not load connections.");
        const batch = listPayload(await response.json());
        data.push(...batch.data.map((row) => connectRow(row, userId)));
        if (data.length >= batch.totalRecords || batch.data.length < limit) break;
        if (page >= 100) return reply({ message: "This account has too many connections to load at once." }, 422);
      }
      return reply({ data });
    }

    if (view === "detail" || view === "threads") {
      const enquiryId = id(params.get("id"));
      if (!enquiryId) return reply({ message: "Enquiry not found." }, 404);
      const response = await upstream(`open_enquiries/${enquiryId}`);
      if (response.status === 404) return reply({ message: "Enquiry not found." }, 404);
      if (!response.ok) throw new Error("Could not load enquiry.");
      const row = record(await response.json());
      const owner = id(row.user_id) === userId;
      if (id(row.id) !== enquiryId || flag(row.is_delete) || (mine && !owner)) return reply({ message: "Enquiry not found." }, 404);
      if (view === "threads") {
        const ownerId = id(row.user_id);
        if (!ownerId) return reply([]);
        const query = new URLSearchParams({ enquiry_id: String(enquiryId) });
        if (!owner) query.set("replyUserId", String(userId));
        const messages = await upstream(`open_enquiries/messages?${query}`);
        if (!messages.ok) throw new Error("Could not load conversations.");
        const raw: unknown = await messages.json();
        if (!Array.isArray(raw)) throw new Error("Invalid conversation response.");
        const records = raw.map(record).filter((item) => id(item.enquiry_id) === enquiryId && id(item.enquiry_user_id) === ownerId);
        const peers = new Map<number, string>();
        for (const item of records) {
          const sender = id(item.user_id);
          if (sender && sender !== ownerId && (owner || sender === userId) && id(item.reply_user_id) === sender) {
            peers.set(sender, [text(item.fname), text(item.lname)].filter(Boolean).join(" "));
          }
        }
        return reply([...peers].map(([peer, name]) => ({
          id: peer,
          name: owner ? name : [text(row.fname), text(row.lname)].filter(Boolean).join(" "),
          messages: records.filter((item) => id(item.reply_user_id) === peer && [peer, ownerId].includes(id(item.user_id)))
            .map((item) => ({ id: id(item.id), text: text(item.message), date: text(item.created_at), mine: id(item.user_id) === userId }))
            .sort((left, right) => left.date.localeCompare(right.date) || left.id - right.id),
        })));
      }
      return reply({ title: text(row.title), description: text(row.description), created_at: text(row.created_at), owner, closed: Boolean(Number(row.status)) });
    }

    if (view === "export") {
      const query = new URLSearchParams({ is_delete: "0" });
      if (mine) query.set("user_id", String(userId));
      const response = await upstream(`open_enquiries?${query}`);
      if (!response.ok) throw new Error("Export unavailable.");
      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid export.");
      return reply(rows.map(record).filter((row) => !flag(row.is_delete) && (!mine || id(row.user_id) === userId)).map(openRow));
    }

    const sortBy = openSortFields.find((field) => field === params.get("sortBy")) ?? "id";
    const query = new URLSearchParams({
      page: String(Math.min(id(params.get("page")) || 1, 100000)),
      limit: String(Math.min(id(params.get("limit")) || 25, 100)),
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy, sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    if (mine) query.set("user_id", String(userId));
    const response = await upstream(`open_enquiries/server-side?${query}`);
    if (!response.ok) throw new Error("Could not load open enquiries.");
    const result = listPayload(await response.json());
    if (result.data.some((row) => flag(row.is_delete) || (mine && id(row.user_id) !== userId))) throw new Error("Unscoped enquiry list.");
    return reply({ ...result, data: result.data.map(openRow) });
  } catch {
    return reply({ message: "Enquiries could not be loaded. Please try again." }, 502);
  }
}
