import { canManageSellerProducts } from "@/lib/sellerProducts";
import { sourcingId as positiveId } from "@/lib/sourcingInterest";
import { accountFlag, accountRecord as record, displayText as text } from "@/lib/userDashboard";

const listFields = ["id", "title", "slug", "category_name", "file_name", "created_at", "updated_at"];
const detailFields = ["id", "title", "code", "article_number", "status", "short_description", "description",
  "category", "sub_category", "item_category_id", "item_subcategory_id"];
const sortFields = ["id", "title", "category_name", "created_at", "updated_at"];

function pick(row: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.map((key) => [key, text(row[key])]));
}

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return reply({ message: "Please sign in again." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "Products API is unavailable." }, 503);

  const params = new URL(request.url).searchParams;
  const productId = positiveId(params.get("id"));
  if (params.has("id") && !productId) return reply({ message: "Product not found." }, 404);

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20000)]);
  const upstream = (path: string) => fetch(`${base}/${path}`, {
    headers: { Authorization: authorization }, signal, cache: "no-store", redirect: "error",
  });

  try {
    const profile = await upstream("signup/profile");
    if ([401, 403].includes(profile.status)) return reply({ message: "Please sign in again." }, 401);
    if (!profile.ok) throw new Error("Could not verify profile.");
    const user = record(record(await profile.json()).user);
    const userId = positiveId(user.id);
    if (!userId) return reply({ message: "Please sign in again." }, 401);
    if (!canManageSellerProducts(user)) return reply({ message: "Product management is available to eligible seller accounts." }, 403);

    if (productId) {
      const response = await upstream(`products/${productId}`);
      if (response.status === 404) return reply({ message: "Product not found." }, 404);
      if (!response.ok) throw new Error("Could not load product.");
      const row = record(await response.json());
      if (positiveId(row.id) !== productId || positiveId(row.user_id) !== userId || accountFlag(row.is_delete)) {
        return reply({ message: "Product not found." }, 404);
      }
      const images = Array.isArray(row.images) ? row.images.map((image) => pick(record(image), ["id", "file"])) : [];
      return reply({ ...pick(row, detailFields), images });
    }

    const sortBy = params.get("sortBy") ?? "";
    const page = Math.min(100000, positiveId(params.get("page")) || 1);
    const limit = Math.min(100, positiveId(params.get("limit")) || 25);
    const query = new URLSearchParams({
      user_id: String(userId), page: String(page), limit: String(limit),
      search: (params.get("search") ?? "").trim().slice(0, 100),
      sortBy: sortFields.includes(sortBy) ? sortBy : "id", sort: params.get("sort") === "ASC" ? "ASC" : "DESC",
    });
    // The legacy list filters on user_id before pagination and omits it from returned rows.
    const response = await upstream(`products/server-side?${query}`);
    if (!response.ok) throw new Error("Could not load product list.");
    const payload = record(await response.json());
    const totalRecords = Number(payload.totalRecords);
    const filteredRecords = Number(payload.filteredRecords);
    if (!Array.isArray(payload.data) || !Number.isSafeInteger(totalRecords) || !Number.isSafeInteger(filteredRecords)
      || totalRecords < 0 || filteredRecords < 0) throw new Error("Invalid product list.");
    return reply({ data: payload.data.map((row) => pick(record(row), listFields)), totalRecords, filteredRecords });
  } catch {
    return reply({ message: "Products could not be loaded. Please try again." }, 502);
  }
}
