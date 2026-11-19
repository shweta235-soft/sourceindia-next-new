import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { buyerSortFields, leadSortFields, leadText, leadViews, openSortFields, openViews, type LeadDetailResult, type LeadRecord, type OpenEnquiryDetailResult } from "@/lib/adminEnquiries";

const noStore = { "Cache-Control": "private, no-store" };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}

class UpstreamError extends Error {
  constructor(readonly status: number) { super("Enquiry service unavailable."); }
}

const record = (item: unknown): LeadRecord => item && typeof item === "object" && !Array.isArray(item) ? item as LeadRecord : {};
const pick = (value: LeadRecord, keys: readonly string[]) =>
  Object.fromEntries(keys.map((key) => [key, value[key]]));
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const safeSearch = /^[\p{L}\p{M}\p{N} @._+&()\-]{0,100}$/u;
const numericId = /^\d{1,12}$/;
const safeNumber = /^[\p{L}\p{N}_-]{1,100}$/u;

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view enquiries." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "Enquiry API is not configured." }, 503);
  const query = request.nextUrl.searchParams;
  const action = query.get("action") ?? "list";

  async function fetchValue(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new UpstreamError(response.status);
    return response.json();
  }

  async function fetchRecord(path: string) {
    return record(await fetchValue(path));
  }

  try {
    if (action === "buyer-users" || action === "buyer-companies") {
      const users = action === "buyer-users";
      const data = await fetchValue(users ? "users/all" : "companies/all");
      if (!Array.isArray(data)) throw new Error("Unexpected buyer filter response.");
      return json(data.map((item) => {
        const row = record(item);
        return {
          id: leadText(row.id),
          name: users ? [leadText(row.fname), leadText(row.lname)].filter(Boolean).join(" ") : leadText(row.organization_name),
        };
      }).filter(({ id, name }) => numericId.test(id) && name));
    }

    if (action === "open-detail") {
      const id = query.get("id") ?? "";
      if (!numericId.test(id)) return json({ message: "Invalid open enquiry ID." }, 400);
      const item = await fetchRecord(`open_enquiries/${id}`);
      if (!item.id) return json({ message: "Enquiry not found." }, 404);
      const messages = await fetchValue(`open_enquiries/messages?enquiry_id=${id}`).then((data) =>
        Array.isArray(data) ? data.map((message) => pick(record(message), ["id", "user_id", "fname", "lname", "message", "created_at"])) : null,
      ).catch(() => null);
      return json({
        record: pick(item, ["id", "user_id", "fname", "lname", "name", "email", "mobile", "phone", "title", "description", "status", "created_at"]),
        messages,
      } satisfies OpenEnquiryDetailResult);
    }

    if (action === "counts") {
      const response = await fetchRecord("enquiries/count");
      return json(pick(response, ["getApprove", "status1", "status2", "status0"]));
    }

    if (action === "detail") {
      const number = query.get("number") ?? "";
      if (!safeNumber.test(number)) return json({ message: "Invalid enquiry number." }, 400);
      const path = `enquiries/${encodeURIComponent(number)}`;
      const item = await fetchRecord(path);
      if (!item.enquiry_number) return json({ message: "Enquiry not found." }, 404);
      const id = leadText(item.id);
      const pending = item.is_approve != null && Number(item.is_approve) === 0 && Number(item.is_delete) !== 1;
      const [messages, previous, next] = await Promise.all([
        id && /^\d+$/.test(id) && item.user_id != null
          ? fetchRecord(`enquiries/messages?enq_id=${id}`).then((data) => {
            if (!Array.isArray(data.data)) return null;
            return data.data.map((message) => pick(record(message),
              ["id", "user_id", "user_fname", "user_lname", "user_file", "seller_file", "message", "updated_at", "created_at"]));
          }).catch(() => null)
          : [],
        pending ? fetchRecord(`${path}/previous`).then((data) => leadText(data.prev)).catch(() => "") : "",
        pending ? fetchRecord(`${path}/next`).then((data) => leadText(data.next)).catch(() => "") : "",
      ]);
      const product = record(item.product_details);
      return json({
        record: {
          ...pick(item, [
            "id", "user_id", "enquiry_number", "name", "email", "phone", "company", "from_full_name", "from_email",
            "from_mobile", "from_organization_name", "created_at", "quantity", "description", "is_approve", "is_delete",
            "seller_category_names", "seller_subcategory_names", "enquiry_product",
          ]),
          product_details: {
            ...pick(product, ["title", "slug", "description"]),
            category: record(product.Categories).name,
            sub_category: record(product.SubCategories).name,
            company: record(product.company_info).organization_name,
          },
        },
        messages, previous, next,
      } satisfies LeadDetailResult);
    }

    const view = query.get("view");
    const dashboard = view === "dashboard";
    const lead = dashboard || leadViews.some((value) => value === view);
    const open = openViews.some((value) => value === view);
    const buyer = view === "buyer";
    if (action !== "list" || (!lead && !open && !buyer)) return json({ message: "Invalid enquiry view." }, 400);

    const search = query.get("search")?.trim() ?? "";
    const number = query.get("enquiry_no")?.trim() ?? "";
    if ((lead ? !safeSearch.test(search) || Boolean(number && !safeNumber.test(number)) : search.length > 100)) {
      return json({ message: "Enter a valid search term or enquiry number." }, 400);
    }
    const limit = Number(query.get("limit") ?? (buyer ? 10 : 25));
    const page = Number(query.get("page") ?? 1);
    if (!(buyer ? [10, 25, 50, 100] : [25, 50, 100]).includes(limit) || !Number.isSafeInteger(page) || page < 1) {
      return json({ message: "Invalid page or page size." }, 400);
    }
    const sortFields = lead ? leadSortFields : open ? openSortFields : buyerSortFields;
    const sortBy = sortFields.find((field) => field === query.get("sortBy")) ?? "id";
    const upstream = new URLSearchParams({
      page: String(page), limit: String(limit), sortBy, sort: query.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    if (search) upstream.set("search", search);
    if (dashboard) upstream.set("viewType", "dashboard");
    if (lead && !dashboard) {
      upstream.set("viewType", "leads");
      upstream.set("getPublic", String(view === "public"));
      upstream.set("getApprove", String(view === "approved"));
      upstream.set("getNotApprove", String(view === "pending"));
      upstream.set("getDeleted", String(view === "deleted"));
      if (number) upstream.set("enquiry_no", number);
    }
    if (open) upstream.set("getDeleted", String(view === "open-deleted"));
    const filters = lead ? ["category", "sub_category"] : buyer ? ["user_id", "company_id"] : [];
    for (const field of filters) {
      const value = query.get(field);
      if (value && numericId.test(value)) upstream.set(field, value);
    }
    const start = query.get("startDate") ?? "";
    const end = query.get("endDate") ?? "";
    if (!buyer && (start || end)) {
      if (!isDate(start) || !isDate(end) || start > end) return json({ message: "Select a valid date range." }, 400);
      upstream.set("dateRange", "customrange");
      upstream.set("startDate", start);
      upstream.set("endDate", end);
    }

    const path = lead ? "enquiries/server-side" : open ? "open_enquiries/server-side" : "buyerenquiry/admin";
    const result = await fetchRecord(`${path}?${upstream}`);
    if (!Array.isArray(result.data) || !Number.isFinite(result.totalRecords) || !Number.isFinite(result.filteredRecords)) {
      throw new Error("Unexpected enquiry list response.");
    }
    const leadFields = ["id", "enquiry_number", "quantity", "product_name", "enquiry_product", "product_slug", "created_at", "updated_at",
      "from_full_name", "from_organization_name", "from_organization_slug", "from_email", "from_mobile", "from_user_type",
      "to_full_name", "to_organization_name", "to_organization_slug", "to_email", "to_mobile", "to_user_type",
      "category_name", "sub_category_name", "is_approve", "is_delete"];
    const openFields = ["id", "name", "email", "phone", "user_type", "title", "description", "is_home", "created_at", "updated_at"];
    const party = (entry: unknown) => {
      const person = record(entry);
      return { ...pick(person, ["fname", "lname"]), company_info: pick(record(person.company_info), ["organization_name", "organization_slug"]) };
    };
    const data = result.data.map((item) => {
      const row = record(item);
      if (!buyer) return pick(row, lead ? leadFields : openFields);
      return { ...pick(row, ["id", "title", "message", "created_at"]), sender: party(row.sender), receiver: party(row.receiver) };
    });
    return json({ ...pick(result, ["totalRecords", "filteredRecords"]), data });
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404 && (action === "detail" || action === "open-detail")) {
      return json({ message: "Enquiry not found." }, 404);
    }
    return json({ message: "Enquiry API data could not be loaded. Please try again." }, 502);
  }
}
