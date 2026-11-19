import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText } from "@/lib/adminEnquiries";
import type { Member } from "@/lib/adminMembers";

const variants = ["all", "inactive", "notApproved", "notCompleted", "deleted"];
const ids = /^\d{1,12}$/;
const date = /^\d{4}-\d{2}-\d{2}$/;
const buyerSort = ["id", "user_company", "address", "user_category", "full_name", "country_name", "created_at", "updated_at"];
const sellerSort = ["id", "organization_name", "coreactivity_name", "designation", "created_at", "updated_at", "approve_date"];
const commonFields = [
  "id", "company_id", "full_name", "fname", "lname", "email", "mobile", "country_name", "state_name", "city_name",
  "address", "zipcode", "status", "is_approve", "is_seller", "is_trading", "is_delete", "elcina_member", "created_at", "updated_at",
  "user_company", "website", "organization_name", "organization_slug", "company_website", "user_category",
  "company_email", "designation", "organization_quality_certification", "category_name", "sub_category_name",
  "coreactivity_name", "activity_name", "membership_plan_name", "user_count", "approve_date", "walkin_buyer", "is_sourcing_interest", "interest_names",
];
const detailFields = [
  "country", "state", "city", "country_code", "alternate_number", "file_name", "company_file_name", "company_location",
  "plan_name", "company_video_second", "organizations_product_description", "core_activity", "activity",
  "company_meta_title", "is_verified", "is_star_seller", "featured_company", "brief_company", "products",
  "company_sample_ppt_file_name", "company_sample_file_name", "company_video_file_name",
];
const object = (value: unknown): Member => value && typeof value === "object" && !Array.isArray(value) ? value as Member : {};
const pick = (value: unknown, keys: readonly string[]) => {
  const row = object(value);
  return Object.fromEntries(keys.map((key) => [key, row[key]]));
};
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });

class UpstreamError extends Error {
  constructor(readonly status: number) { super("Member API unavailable."); }
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) return json({ message: "Please sign in to view members." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "Member API is not configured." }, 503);

  const input = request.nextUrl.searchParams;
  const kind = input.get("kind");
  if (kind !== "buyers" && kind !== "sellers") return json({ message: "Invalid member type." }, 400);
  const action = input.get("action") ?? "list";

  const signal = AbortSignal.timeout(15000);
  async function upstream(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, { cache: "no-store", redirect: "error", signal });
    if (!response.ok) throw new UpstreamError(response.status);
    return response.json();
  }

  try {
    if (action === "messages" && kind === "sellers") {
      const data = object(await upstream("sellers/with-messages"));
      return json(Array.isArray(data.user_ids) ? data.user_ids.map(leadText).filter((id) => ids.test(id)) : []);
    }
    if (action === "detail" || action === "sourcing") {
      const id = input.get("id") ?? "";
      if (!ids.test(id)) return json({ message: "Invalid member ID." }, 400);
      if (action === "sourcing") {
        if (kind !== "buyers") return json({ message: "Invalid member type." }, 400);
        const result = object(await upstream(`buyers/get-buyer-sourcing-interests?user_id=${id}`));
        if (!Array.isArray(result.data)) throw new Error("Invalid sourcing response.");
        return json(result.data.map((item) => {
          const row = object(item);
          return {
            category_name: leadText(row.category_name),
            subcategories: Array.isArray(row.subcategories)
              ? row.subcategories.map((sub) => leadText(object(sub).name)).filter(Boolean) : [],
          };
        }));
      }
      const row = object(await upstream(`${kind}/${id}`));
      if (!row.id || (row.is_seller != null && Number(row.is_seller) !== Number(kind === "sellers"))) {
        return json({ message: "Member not found." }, 404);
      }
      return json({
        ...pick(row, [...commonFields, ...detailFields]), id,
        categories: Array.isArray(row.categories)
          ? row.categories.map((entry) => pick(entry, ["category_id", "category_name", "subcategory_id", "subcategory_name"])) : [],
      });
    }

    const variant = input.get("variant") ?? "all";
    const page = Number(input.get("page") ?? 1);
    const limit = Number(input.get("limit") ?? 25);
    if (action !== "list" || !variants.includes(variant) || !Number.isSafeInteger(page) || page < 1 || ![10, 25, 50, 100].includes(limit)) {
      return json({ message: "Invalid member list request." }, 400);
    }

    const sortFields = kind === "buyers" ? buyerSort : sellerSort;
    const sortBy = sortFields.find((field) => field === input.get("sortBy")) ?? "id";
    const query = new URLSearchParams({
      page: String(page), limit: String(limit), sortBy, sort: input.get("sort") === "ASC" ? "ASC" : "DESC",
      getInactive: String(variant === "inactive"), getNotApproved: String(variant === "notApproved"), getDeleted: String(variant === "deleted"),
    });
    if (kind === "sellers") query.set("getNotCompleted", String(variant === "notCompleted"));
    if (input.get("todayOnly") === "true") query.set("todayOnly", "true");
    const common = ["search", "customerId", "country", "state", "city"];
    const filters = kind === "buyers" ? ["full_name", "sourcing_interest"] :
      ["firstName", "lastName", "organizationName", "core_activity", "activity", "categoryId", "nature_business", "designation", "elcina_member"];
    for (const field of [...common, ...filters]) {
      const value = input.get(field)?.trim();
      if (value && value.length <= 150) query.set(field, value);
    }
    const start = input.get("startDate") ?? "";
    const end = input.get("endDate") ?? "";
    if (start || end) {
      if (!date.test(start) || !date.test(end) || start > end) return json({ message: "Select a valid date range." }, 400);
      query.set("dateRange", "customrange");
      query.set("startDate", start);
      query.set("endDate", end);
    }
    async function list(params: URLSearchParams) {
      const result = object(await upstream(`${kind}/server-side?${params}`));
      if (!Array.isArray(result.data) || typeof result.totalRecords !== "number" || typeof result.filteredRecords !== "number" ||
          !Number.isSafeInteger(result.totalRecords) || !Number.isSafeInteger(result.filteredRecords) ||
          result.totalRecords < 0 || result.filteredRecords < 0) {
        throw new Error("Invalid member response.");
      }
      return { data: result.data.map((row) => pick(row, commonFields)), totalRecords: result.totalRecords, filteredRecords: result.filteredRecords };
    }

    const sourcing = query.get("sourcing_interest");
    if (sourcing !== "yes" && sourcing !== "no") {
      query.delete("sourcing_interest");
      try {
        return json(await list(query));
      } catch (error) {
        // Older buyer API versions sort Country using an association alias that the list does not include.
        if (!(error instanceof UpstreamError) || error.status !== 500 ||
            kind !== "buyers" || sortBy !== "country_name" || query.get("todayOnly") !== "true") throw error;
      }

      query.set("sortBy", "id");
      query.set("page", "1");
      query.set("limit", "100");
      const first = await list(query);
      const rows = [...first.data];
      for (let nextPage = 2; nextPage <= Math.ceil(first.filteredRecords / 100); nextPage++) {
        query.set("page", String(nextPage));
        rows.push(...(await list(query)).data);
      }
      const country = (row: Member) => leadText(row.country_name).trim();
      const known = (row: Member) => Boolean(country(row) && country(row) !== "NA");
      const collator = new Intl.Collator("en", { sensitivity: "base" });
      const direction = query.get("sort") === "ASC" ? 1 : -1;
      rows.sort((a, b) => Number(known(b)) - Number(known(a)) || direction * collator.compare(country(a), country(b)));
      return json({ ...first, data: rows.slice((page - 1) * limit, page * limit) });
    }

    // The existing buyer API applies sourcing interest after its SQL page limit.
    query.delete("sourcing_interest");
    query.set("page", "1");
    query.set("limit", "100");
    const first = await list(query);
    const data: Member[] = [];
    let filteredRecords = 0;
    function addMatches(rows: Member[]) {
      for (const row of rows) {
        if (row.is_sourcing_interest !== sourcing) continue;
        filteredRecords++;
        if (filteredRecords > (page - 1) * limit && filteredRecords <= page * limit) data.push(row);
      }
    }
    addMatches(first.data);
    const pages = Math.ceil(first.filteredRecords / 100);
    for (let start = 2; start <= pages; start += 4) {
      const batch = await Promise.all(Array.from({ length: Math.min(4, pages - start + 1) }, (_, index) => {
        const params = new URLSearchParams(query);
        params.set("page", String(start + index));
        return list(params);
      }));
      for (const result of batch) addMatches(result.data);
    }
    return json({ data, totalRecords: first.totalRecords, filteredRecords });
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404 && action === "detail") return json({ message: "Member not found." }, 404);
    return json({ message: "Members could not be loaded from the SourceIndia API." }, 502);
  }
}
