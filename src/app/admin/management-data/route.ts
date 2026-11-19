import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { managementLists, type ManagementList } from "@/lib/adminManagement";

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function pick(value: unknown, keys: string[]) {
  const row = record(value);
  return Object.fromEntries(keys.map((key) => [
    key, typeof row[key] === "boolean" ? String(Number(row[key])) : leadText(row[key]),
  ]));
}

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view these records." }, 401);
  }
  const params = request.nextUrl.searchParams;
  const kind = params.get("kind") ?? "";
  const action = params.get("action");
  if (!Object.hasOwn(managementLists, kind) || (action !== "list" &&
    ((action !== "options" && action !== "export") || kind === "category_conflict_logs"))) {
    return json({ message: "Unknown management view." }, 400);
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The management API is not configured." }, 503);
  const { fields, sort } = managementLists[kind as ManagementList];

  async function read(path: string) {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Management service unavailable.");
    return response.json() as Promise<unknown>;
  }

  try {
    if (action === "options" || action === "export") {
      const result = await read(action === "export" ? kind : kind === "roles" ? "ticket_categories" : "roles");
      if (!Array.isArray(result)) throw new Error("Unexpected record list.");
      const rows = result.filter((row) => Number(record(row).is_delete ?? 0) === 0);
      if (action === "export") return json(rows.map((row) => pick(row, fields)));
      return json(rows.map((row) => pick(row, ["id", "name"])).filter(({ id, name }) => id && name));
    }

    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sortBy = params.get("sortBy") ?? "";
    const query = new URLSearchParams({
      page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
      limit: ["25", "50", "100"].includes(limit) ? limit : "25",
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy: sort.includes(sortBy) ? sortBy : "id",
      sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    const list = record(await read(`${kind}/server-side?${query}`));
    const totalRecords = Number(list.totalRecords);
    const filteredRecords = Number(list.filteredRecords);
    if (!Array.isArray(list.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected management data.");
    }
    return json({ data: list.data.map((row) => pick(row, fields)), totalRecords, filteredRecords });
  } catch {
    return json({ message: "Management data could not be loaded." }, 502);
  }
}
