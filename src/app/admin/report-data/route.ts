import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { reportSources, reports, type ReportKind, type ReportSource } from "@/lib/adminReports";

const idPattern = /^\d{1,12}$/;

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function project(rows: unknown[], fields: string[]) {
  return rows.map((value) => {
    const row = record(value);
    return Object.fromEntries(fields.map((key) => [
      key, typeof row[key] === "boolean" ? String(Number(row[key])) : leadText(row[key]),
    ]));
  });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view reports." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The reports API is not configured." }, 503);
  const params = request.nextUrl.searchParams;

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Reports service unavailable.");
    return response.json();
  }

  try {
    if (params.get("action") === "options") {
      const key = params.get("source") ?? "";
      if (!Object.hasOwn(reportSources, key)) return json({ message: "Unknown report filter." }, 400);
      const source = reportSources[key as ReportSource];
      const dependent = "parent" in source;
      const parent = params.get("parent") ?? "";
      if (dependent && !idPattern.test(parent)) return json({ message: "Invalid filter selection." }, 400);
      const result = await read(dependent ? `${source.path}/${parent}` : source.path);
      const rows = "listKey" in source ? record(result)[source.listKey] : result;
      if (!Array.isArray(rows)) throw new Error("Unexpected filter data.");
      return json(project(rows.filter((row) => Number(record(row).is_delete ?? 0) === 0), source.fields));
    }

    const kind = params.get("kind") ?? "";
    if (params.get("action") !== "export" || !Object.hasOwn(reports, kind)) {
      return json({ message: "Unknown report." }, 400);
    }
    const report = reports[kind as ReportKind];
    const query = new URLSearchParams();
    for (const filter of report.filters) {
      const value = params.get(filter.key);
      if (!value) continue;
      if (filter.valueKey === "id" && !idPattern.test(value) ||
          filter.options && !filter.options.some((option) => option.value === value) ||
          value.length > (filter.key === "brief_company" ? 6000 : 500)) {
        return json({ message: `Invalid ${filter.label} filter.` }, 400);
      }
      if (!filter.parent || params.get(filter.parent)) query.set(filter.key, value);
    }
    for (const [, flag] of report.flags ?? []) {
      if (params.get(flag) === "1") query.set(flag, "1");
    }
    const start = params.get("startDate") ?? "";
    const end = params.get("endDate") ?? "";
    if (start || end) {
      const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Number.isFinite(Date.parse(date)) && new Date(date).toISOString().startsWith(date);
      if (!validDate(start) || !validDate(end) || start > end) return json({ message: "Invalid date range." }, 400);
      query.set("dateRange", "customrange");
      query.set("startDate", start);
      query.set("endDate", end);
    }
    const rows = await read(`${report.path}?${query}`);
    if (!Array.isArray(rows)) throw new Error("Unexpected export data.");
    return json(project(rows, report.columns.map(([, field]) => field)));
  } catch {
    return json({ message: "Report data could not be loaded." }, 502);
  }
}
