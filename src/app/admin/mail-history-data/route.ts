import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { mailCounters, mailDeliveryStatuses, validMailCode } from "@/lib/adminMailHistory";

const summaryFields = ["mail_code", "mail_master_list", "mail_master_type", ...mailCounters.map(([key]) => key)];
const listFields = ["id", ...summaryFields, "created_at"];
const recipientFields = ["id", "user_name", "user_email", "mail", "email_id", "organization_name", "mail_type_label", "delivery_status",
  "is_open", "open_count", "opened_at", "country", "state", "city", "mail_send_time", "is_failed"];
const listSort = ["id", "mail_master_list", "mail_master_type", ...mailCounters.map(([key]) => key), "created_at"];
const recipientSort = ["id", "user_name", "organization_name", "mail_type", "delivery_status", "is_open", "opened_at", "country", "mail_send_time"];

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function pick(value: unknown, keys: string[]) {
  const row = record(value);
  return Object.fromEntries(keys.map((key) => [key, typeof row[key] === "boolean" ? String(Number(row[key])) : leadText(row[key])]));
}

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view mail history." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The mail history API is not configured." }, 503);
  const params = request.nextUrl.searchParams;
  const action = params.get("action");
  if (action !== "list" && action !== "detail") return json({ message: "Unknown mail history view." }, 400);
  const detail = action === "detail";
  const code = params.get("code") ?? "";
  if (detail && !validMailCode(code)) return json({ message: "Invalid mail code." }, 400);

  const page = params.get("page") ?? "";
  const limit = params.get("limit") ?? "";
  const sortBy = params.get("sortBy") ?? "";
  const query = new URLSearchParams({
    page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
    limit: (detail ? ["1", "25", "50", "100"] : ["25", "50", "100"]).includes(limit) ? limit : "25",
    search: (params.get("search") ?? "").slice(0, 100),
    sortBy: (detail ? recipientSort : listSort).includes(sortBy) ? sortBy : "id",
    sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    getDeleted: String(params.get("deleted") === "true"),
  });
  if (detail) {
    const filter = params.get("statusFilter") ?? "";
    const status = mailDeliveryStatuses.includes(filter) ? filter : "all";
    query.set("statusFilter", status);
    query.set("status", status);
  } else {
    const start = params.get("startDate") ?? "";
    const end = params.get("endDate") ?? "";
    const useDates = [start, end].every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) && start <= end;
    query.set("dateRange", useDates ? "customrange" : "");
    query.set("startDate", useDates ? start : "");
    query.set("endDate", useDates ? end : "");
  }

  try {
    const path = detail ? `details/${encodeURIComponent(code)}` : "server-side";
    const response = await fetch(`${base}/seller_mail_histories/${path}?${query}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404 && detail) return json({ message: "Mail history details could not be found." }, 404);
    if (!response.ok) throw new Error("Mail history service unavailable.");
    const result = record(await response.json());
    const totalRecords = Number(result.totalRecords);
    const filteredRecords = Number(result.filteredRecords);
    if (!Array.isArray(result.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected mail history data.");
    }
    return json({
      data: result.data.map((row) => pick(row, detail ? recipientFields : listFields)),
      totalRecords,
      filteredRecords,
      ...(detail && result.summary ? { summary: pick(result.summary, summaryFields) } : {}),
    });
  } catch {
    return json({ message: "Mail history data could not be loaded." }, 502);
  }
}
