import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";

const ticketFields = ["id", "ticket_id", "title", "full_name", "fname", "lname", "email", "phone", "user_id", "last_reply_date",
  "priority", "category_name", "status", "created_at", "updated_at"];
const categoryFields = ["id", "name", "email", "status", "created_at", "updated_at"];
const ticketSort = ["id", "ticket_id", "title", "full_name", "last_reply_date", "priority", "category_name"];
const categorySort = ["id", "name", "email"];
const ticketFilters = ["title", "status", "priority", "category", "startDate", "endDate", "dateRange"];

const record = (value: unknown): LeadRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
const pick = (value: unknown, fields: string[]) => {
  const row = record(value);
  return Object.fromEntries(fields.map((field) => [field, leadText(row[field])]));
};
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view support data." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "Support API is not configured." }, 503);

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  const params = request.nextUrl.searchParams;
  const action = params.get("action");
  try {
    if (action === "detail") {
      const id = params.get("id") ?? "";
      if (!/^\d{1,12}$/.test(id)) return json({ message: "Invalid ticket ID." }, 400);
      const data = record(await read(`tickets/${id}`));
      const ticket = record(data.ticket);
      if (!ticket.id) return json({ message: "Ticket not found." }, 404);
      return json({
        ticket: { ...pick(ticket, ticketFields), category_name: leadText(record(ticket.TicketCategory).name) || leadText(ticket.category_name) },
        replies: Array.isArray(data.replies) ? data.replies.map((reply) =>
          pick(reply, ["id", "sender_type", "added_by", "description", "reply", "createdAt", "created_at", "attachment"])) : [],
        lastReply: pick(data.lastReply, ["created_at"]),
      });
    }

    if (action === "categories" || action === "buyers") {
      const buyers = action === "buyers";
      const rows = await read(buyers ? "buyers" : "ticket_categories");
      if (!Array.isArray(rows)) throw new Error("Unexpected options.");
      return json(rows.map((row) => {
        const entry = record(row);
        const name = buyers ? [leadText(entry.fname), leadText(entry.lname)].filter(Boolean).join(" ") : leadText(entry.name);
        return { id: leadText(entry.id), name };
      }).filter(({ id, name }) => id && name));
    }

    if (action !== "tickets" && action !== "ticket_categories") {
      return json({ message: "Unknown support view." }, 400);
    }
    const tickets = action === "tickets";
    const fields = tickets ? ticketFields : categoryFields;
    if (params.get("export") === "1") {
      const rows = await read(action);
      if (!Array.isArray(rows)) throw new Error("Unexpected export.");
      return json(rows.map((row) => pick(row, [...fields, "added_by", "getStatus"])));
    }

    const upstream = new URLSearchParams();
    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sortBy = params.get("sortBy") ?? "";
    upstream.set("page", /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1");
    upstream.set("limit", ["25", "50", "100"].includes(limit) ? limit : "25");
    upstream.set("search", (params.get("search") ?? "").slice(0, 100));
    upstream.set("sortBy", (tickets ? ticketSort : categorySort).includes(sortBy) ? sortBy : "id");
    upstream.set("sort", params.get("sort") === "ASC" ? "ASC" : "DESC");
    if (tickets) {
      for (const key of ticketFilters) upstream.set(key, (params.get(key) ?? "").slice(0, 100));
    }
    const result = record(await read(`${action}/server-side?${upstream}`));
    if (!Array.isArray(result.data) || result.totalRecords == null || result.filteredRecords == null) {
      throw new Error("Unexpected list.");
    }
    return json({
      data: result.data.map((row) => pick(row, fields)),
      totalRecords: Number(result.totalRecords) || 0,
      filteredRecords: Number(result.filteredRecords) || 0,
    });
  } catch (error) {
    if (error instanceof Error && ["401", "403"].includes(error.message)) {
      return json({ message: "The support service requires an authorized upstream session." }, 502);
    }
    if (action === "detail" && error instanceof Error && error.message === "404") {
      return json({ message: "Ticket not found." }, 404);
    }
    return json({ message: "Support data could not be loaded." }, 502);
  }
}
