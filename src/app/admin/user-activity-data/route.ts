import { type NextRequest, NextResponse } from "next/server";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { activityCountFields } from "@/lib/adminUserActivity";

const listFields = ["id", "user_id", "user_company_name", "user_company_slug", "user_name", "user_email", "user_mobile",
  "user_status", "user_is_seller", "created_at", "updated_at"];
const exportFields = ["company_name", "user_company_name", "user_fname", "user_lname", "user_email", "user_mobile", "user_type",
  "user_is_seller", "created_at", "updated_at"];
const sortFields = ["id", "user_company_name", "user_status", "user_is_seller", "created_at", "updated_at"];

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

const binaryFields = new Set(["user_status", "user_is_seller"]);

function pick(value: unknown, keys: string[]) {
  const row = record(value);
  return Object.fromEntries(keys.map((key) => {
    const value = row[key];
    return [key, binaryFields.has(key) && typeof value === "boolean" ? String(Number(value)) : leadText(value)];
  }));
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view user activities." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The user activity API is not configured." }, 503);

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/user_activity${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  const params = request.nextUrl.searchParams;
  const action = params.get("action");
  try {
    if (action === "counts") {
      const counts = record(await read("/count"));
      const entries = activityCountFields.flatMap((key) => {
        const raw = leadText(counts[key]).trim();
        const count = Number(raw);
        return raw && Number.isSafeInteger(count) && count >= 0 ? [[key, count]] : [];
      });
      if (!entries.length) throw new Error("Unexpected activity counts.");
      return json(Object.fromEntries(entries));
    }
    if (action === "detail") {
      const id = params.get("id") ?? "";
      if (!/^\d{1,12}$/.test(id)) return json({ message: "Invalid user ID." }, 400);
      const user = record(await read(`/user_id/${id}`));
      if (!Array.isArray(user.user_activity) && !Object.hasOwn(user, "user_fname") && !Object.hasOwn(user, "user_lname")) {
        return json({ message: "User activity history could not be found." }, 404);
      }
      const history = Array.isArray(user.user_activity) ? user.user_activity : [];
      return json({
        ...pick(user, ["user_fname", "user_lname", "user_status", "user_is_seller", "user_updated_at"]),
        user_activity: history.map((row) => pick(row, ["id", "type", "is_side", "created_at"])),
      });
    }
    if (action === "export") {
      const rows = await read("");
      if (!Array.isArray(rows)) throw new Error("Unexpected activity export.");
      return json(rows.map((row) => pick(row, exportFields)));
    }
    if (action !== "list") return json({ message: "Unknown user activity view." }, 400);

    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sort = params.get("sortBy") ?? "";
    const query = new URLSearchParams({
      page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
      limit: ["25", "50", "100"].includes(limit) ? limit : "25",
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy: sortFields.includes(sort) ? sort : "id",
      sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    const result = record(await read(`/server-side?${query}`));
    const totalRecords = Number(result.totalRecords);
    const filteredRecords = Number(result.filteredRecords);
    if (!Array.isArray(result.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected user activity list.");
    }
    return json({ data: result.data.map((row) => pick(row, listFields)), totalRecords, filteredRecords });
  } catch (error) {
    if (action === "detail" && error instanceof Error && error.message === "404") {
      return json({ message: "User activity history could not be found." }, 404);
    }
    return json({ message: "User activity data could not be loaded." }, 502);
  }
}
