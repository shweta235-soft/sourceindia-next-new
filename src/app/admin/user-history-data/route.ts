import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { userHistorySteps, userHistoryTextFilters } from "@/lib/adminUserHistory";

const sortFields = ["id", "organization_name", "steps", "is_seller", "created_at", "updated_at"];
const listFields = ["id", "organization_name", "organization_slug", "elcina_member", "full_name", "email", "mobile", "country_name",
  "state_data", "city_data", "status", "is_seller", "created_at", "updated_at"];
const exportFields = ["getStatus", "company_name", "membership_plan_name", "fname", "lname", "email", "mobile",
  "country_name", "state_name", "city_name", "getUserStatus", "created_at", "updated_at", "status", "is_seller"];
const numericID = /^\d{1,12}$/;

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function pick(value: unknown, fields: string[]) {
  const row = record(value);
  return Object.fromEntries(fields.map((field) => {
    const item = row[field];
    return [field, typeof item === "boolean" ? String(Number(item)) : leadText(item)];
  }));
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view user history." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The user history API is not configured." }, 503);

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
    if (action === "countries" || action === "states" || action === "cities") {
      const parent = params.get("parent") ?? "";
      if (action !== "countries" && !numericID.test(parent)) return json({ message: "Invalid location." }, 400);
      const rows = await read(action === "countries" ? "location/countries" : `location/${action}/${parent}`);
      const options = Array.isArray(rows) ? rows : record(rows).data;
      if (!Array.isArray(options)) throw new Error("Unexpected location options.");
      return json(options.map((row) => pick(row, ["id", "name"])).filter(({ id, name }) => numericID.test(id) && name));
    }
    if (action === "export") {
      const rows = await read("signup/all_users");
      if (!Array.isArray(rows)) throw new Error("Unexpected user history export.");
      return json(rows.map((row) => pick(row, exportFields)));
    }
    if (action !== "list") return json({ message: "Unknown user history view." }, 400);

    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sort = params.get("sortBy") ?? "";
    const step = params.get("mail_type") ?? "";
    const query = new URLSearchParams({
      page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
      limit: ["25", "50", "100"].includes(limit) ? limit : "25",
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy: sortFields.includes(sort) ? sort : "id",
      sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
      mail_type: userHistorySteps.some(([value]) => value === step) ? step : "",
    });
    for (const [key] of userHistoryTextFilters) query.set(key, (params.get(key) ?? "").trim().slice(0, 100));
    let hasParent = true;
    for (const key of ["country", "state", "city"]) {
      const value = params.get(key) ?? "";
      hasParent = hasParent && numericID.test(value);
      query.set(key, hasParent ? value : "");
    }
    const result = record(await read(`signup/server-side?${query}`));
    const totalRecords = Number(result.totalRecords);
    const filteredRecords = Number(result.filteredRecords);
    if (!Array.isArray(result.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected user history list.");
    }
    return json({
      data: result.data.map((row) => pick(row, listFields)),
      totalRecords,
      filteredRecords,
    });
  } catch {
    return json({ message: "User history data could not be loaded." }, 502);
  }
}
