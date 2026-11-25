/** Local, read-only seller product contract based on the legacy Products model. */
export interface LocalSellerProduct {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  code: string | null;
  article_number: string | null;
  short_description: string;
  description: string | null;
  quantity: number | null;
  category: number;
  sub_category: number | null;
  file_id: number | null;
  status: number;
  is_approve: number;
  is_featured: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Strict numeric pagination: no user-provided SQL fragments or custom identifiers. */
export function parseSellerProductPage(url: string): { page: number; limit: number; offset: number } | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const params = parsed.searchParams;
  if ([...params.keys()].some(key => key !== 'page' && key !== 'limit')) return null;
  if (params.getAll('page').length > 1 || params.getAll('limit').length > 1) return null;
  const pageRaw = params.get('page') ?? '1';
  const limitRaw = params.get('limit') ?? '20';
  if (!/^[1-9]\d{0,6}$/.test(pageRaw) || !/^[1-9]\d{0,2}$/.test(limitRaw)) return null;
  const page = Number(pageRaw), limit = Number(limitRaw);
  if (!Number.isSafeInteger(page) || limit > 50) return null;
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) return null;
  return { page, limit, offset };
}

/** Always scoped by the authenticated user AND their active linked company. */
export const sellerProductWhere = `FROM products AS p
 INNER JOIN users AS u ON u.user_id = p.user_id AND u.company_id = p.company_id
 WHERE u.user_id = ? AND u.is_seller = 1 AND u.status = 1 AND u.is_delete = 0
 AND p.is_delete = 0`;

export const sellerProductListSql = `SELECT p.product_id AS id, p.uuid, p.slug, p.title,
 p.code, p.article_number, p.short_description, p.description,
 p.quantity, p.category, p.sub_category, p.file_id,
 p.status, p.is_approve, p.is_featured, p.created_at, p.updated_at
 ${sellerProductWhere}
 ORDER BY p.created_at DESC, p.product_id DESC
 LIMIT ? OFFSET ?`;

export const sellerProductCountSql = `SELECT COUNT(*) AS total ${sellerProductWhere}`;

export function safeSellerProduct(row: LocalSellerProduct): LocalSellerProduct {
  return {
    id: row.id, uuid: row.uuid, slug: row.slug, title: row.title,
    code: row.code, article_number: row.article_number,
    short_description: row.short_description, description: row.description,
    quantity: row.quantity, category: row.category, sub_category: row.sub_category,
    file_id: row.file_id, status: row.status, is_approve: row.is_approve,
    is_featured: row.is_featured, created_at: row.created_at, updated_at: row.updated_at,
  };
}
