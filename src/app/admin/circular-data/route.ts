import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";

const numericID = /^\d{1,12}$/;
const listFields = ["id", "title", "user_type_name", "user_category_name", "created_at", "updated_at"];
const historyFields = ["id", "user_id", "user_name", "user_is_seller", "is_mail", "email_view_count"];
const countFields = ["all", "mailSent", "mailUnSent", "mailOpen", "mailNotOpen"];

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function pick(value: unknown, keys: string[]) {
  const row = record(value);
  return Object.fromEntries(keys.map((key) => [key, leadText(row[key])]));
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view email circulars." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The email circular API is not configured." }, 503);

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  const params = request.nextUrl.searchParams;
  const action = params.get("action");
  const id = params.get("id") ?? "";
  if ((action === "detail" || action === "history" || action === "counts") && !numericID.test(id)) {
    return json({ message: "Invalid email circular ID." }, 400);
  }

  try {
    if (action === "detail") {
      const row = record(await read(`newsletters/${id}`));
      if ((row.id != null && leadText(row.id) !== id) || !Object.hasOwn(row, "title")) {
        return json({ message: "Email circular could not be found." }, 404);
      }
      const images = Array.isArray(row.images) ? row.images.map((item) => {
        const image = record(item);
        return { id: leadText(image.id), file: leadText(image.file) };
      }).filter(({ file }) => file) : [];
      return json({ ...pick(row, ["id", "title", "subject", "description", "user_type"]), images });
    }
    if (action === "counts") {
      const counts = record(await read(`newsletter_histories/count?newsLatter_id=${id}`));
      return json(pick(counts, countFields));
    }
    if (action === "user-types" || action === "export") {
      const userTypes = action === "user-types";
      const rows = await read(userTypes ? "newsletters/user_type" : "newsletters");
      if (!Array.isArray(rows)) throw new Error("Unexpected circular response.");
      return json(rows.map((row) => pick(row, userTypes ? ["id", "name"] : listFields)));
    }
    if (action !== "list" && action !== "history") return json({ message: "Unknown email circular view." }, 400);

    const history = action === "history";
    const page = params.get("page") ?? "";
    const limit = params.get("limit") ?? "";
    const sort = params.get("sortBy") ?? "";
    const sortFields = history ? ["id", "user_name"] : ["id", "title", "user_type_name", "created_at", "updated_at"];
    const query = new URLSearchParams({
      page: /^\d{1,8}$/.test(page) && Number(page) > 0 ? page : "1",
      limit: ["25", "50", "100"].includes(limit) ? limit : "25",
      search: (params.get("search") ?? "").slice(0, 100),
      sortBy: sortFields.includes(sort) ? sort : "id",
      sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    if (history) query.set("newsLatter_id", id);
    const result = record(await read(`${history ? "newsletter_histories" : "newsletters"}/server-side?${query}`));
    const totalRecords = Number(result.totalRecords);
    const filteredRecords = Number(result.filteredRecords);
    if (!Array.isArray(result.data) || ![totalRecords, filteredRecords].every((count) => Number.isSafeInteger(count) && count >= 0)) {
      throw new Error("Unexpected circular list.");
    }
    return json({ data: result.data.map((row) => pick(row, history ? historyFields : listFields)), totalRecords, filteredRecords });
  } catch (error) {
    if (action === "detail" && error instanceof Error && error.message === "404") {
      return json({ message: "Email circular could not be found." }, 404);
    }
    return json({ message: "Email circular data could not be loaded." }, 502);
  }
}
