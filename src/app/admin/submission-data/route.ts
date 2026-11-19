import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { registrationCategories } from "@/lib/adminSubmissions";

const contactFields = ["id", "full_name", "fname", "lname", "email", "subject", "created_at", "updated_at"];
const registrationFields = ["id", "category", "name", "email", "mobile", "state_name", "city_name", "designation", "organization", "created_at", "updated_at"];
const locationID = /^\d{1,12}$/;

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view these records." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The records API is not configured." }, 503);

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`Upstream ${response.status}`);
    return response.json();
  }

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind");
  const action = params.get("action");
  const deleted = params.get("deleted") === "true";
  const state = params.get("state") ?? "";

  try {
    if (action === "states" || action === "cities") {
      if (action === "cities" && !locationID.test(state)) return json({ message: "Invalid state." }, 400);
      const options = await read(action === "states" ? "location/states" : `location/cities/${state}`);
      if (!Array.isArray(options)) throw new Error("Unexpected options.");
      return json(options.map((item) => {
        const row = record(item);
        return { id: leadText(row.id), name: leadText(row.name) };
      }).filter(({ id, name }) => locationID.test(id) && name));
    }
    if (kind !== "contacts" && kind !== "registrations") return json({ message: "Unknown records list." }, 400);

    const contacts = kind === "contacts";
    const fields = contacts ? contactFields : registrationFields;
    const toRow = (value: unknown) => {
      const row = record(value);
      return Object.fromEntries(fields.map((field) => [field, leadText(row[field])]));
    };

    if (action === "export") {
      const rows = await read(kind);
      if (!Array.isArray(rows)) throw new Error("Unexpected export.");
      const expected = deleted ? "1" : "0";
      return json(rows.filter((row) => leadText(record(row).is_delete) === expected).map(toRow));
    }

    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sortBy = params.get("sortBy") ?? "";
    const sortFields = contacts ? ["id", "full_name", "email", "subject", "created_at", "updated_at"] :
      ["id", "category", "name", "state_name", "designation", "organization", "created_at", "updated_at"];
    const upstream = new URLSearchParams({
      page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
      limit: ["25", "50", "100"].includes(limit) ? limit : "25",
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy: sortFields.includes(sortBy) ? sortBy : "id",
      sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
      getDeleted: String(deleted),
    });
    const from = params.get("startDate") ?? "";
    const to = params.get("endDate") ?? "";
    if (deleted && [from, to].every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) && from <= to) {
      upstream.set("dateRange", "customrange");
      upstream.set("startDate", from);
      upstream.set("endDate", to);
    }
    if (!contacts && !deleted) {
      for (const field of ["registrationName", "registrationEmail", "registrationMobile"]) {
        upstream.set(field, (params.get(field) ?? "").slice(0, 100));
      }
      const city = params.get("city") ?? "";
      const category = params.get("registrationCategory") ?? "";
      if (locationID.test(state)) upstream.set("state", state);
      if (locationID.test(state) && locationID.test(city)) upstream.set("city", city);
      if (registrationCategories.some((label) => label.toLowerCase() === category)) upstream.set("registrationCategory", category);
    }
    const result = record(await read(`${kind}/server-side?${upstream}`));
    const totalRecords = Number(result.totalRecords);
    const filteredRecords = Number(result.filteredRecords);
    if (!Array.isArray(result.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected list.");
    }
    return json({ data: result.data.map(toRow), totalRecords, filteredRecords });
  } catch {
    return json({ message: "Unable to load records from the upstream service." }, 502);
  }
}
