/** Explicitly selected public catalog fields; never expose internal product/account data. */
export const PUBLIC_PRODUCT_FIELDS = `p.product_id AS id, p.slug, p.title, p.code,
 p.short_description, p.category, p.sub_category, p.file_id,
 p.is_featured, p.created_at`;
export const PUBLIC_PRODUCT_WHERE = `FROM products AS p WHERE p.is_delete = 0
 AND p.status = 1 AND p.is_approve = 1`;
export const PUBLIC_PRODUCT_LIST = `SELECT ${PUBLIC_PRODUCT_FIELDS} ${PUBLIC_PRODUCT_WHERE}
 ORDER BY p.created_at DESC, p.product_id DESC`;
export const PUBLIC_PRODUCT_COUNT = `SELECT COUNT(*) AS total ${PUBLIC_PRODUCT_WHERE}`;
export const PUBLIC_PRODUCT_DETAIL = `SELECT ${PUBLIC_PRODUCT_FIELDS}, p.description, p.quantity,
 p.article_number, p.content FROM products AS p
 WHERE p.is_delete = 0 AND p.status = 1 AND p.is_approve = 1
 AND p.slug = ? LIMIT 1`;
export const PUBLIC_CATEGORIES = `SELECT category_id AS id, uuid, name, slug,
 cat_file_id, stock_file_id, prefix, top_category, is_other
 FROM categories WHERE is_delete = 0 AND status = 1
 ORDER BY name ASC`;
export const PUBLIC_SUBCATEGORIES = `SELECT sub_category_id AS id, uuid, name,
 slug, category, file_id FROM sub_categories
 WHERE is_delete = 0 AND status = 1 AND category = ? ORDER BY name ASC`;

/** Ignore only standard UTM link-attribution parameters (not application filters).
 * Links opened from chat or campaigns may append utm_source automatically.
 * Unknown functional parameters remain rejected to catch caller mistakes.
 */
export function isCatalogTrackingParam(key: string): boolean {
  return /^utm_(source|medium|campaign|term|content|id)$/i.test(key);
}

/** Block duplicate, unknown, overflow, and negative query parameters. */
export function catalogPage(url: string): { limit: number; offset: number; page: number } | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if ([...u.searchParams.keys()].some(k => k !== 'page' && k !== 'limit' && !isCatalogTrackingParam(k))) return null;
  if (u.searchParams.getAll('page').length > 1 || u.searchParams.getAll('limit').length > 1) return null;
  const pageText = u.searchParams.get('page') ?? '1';
  const limitText = u.searchParams.get('limit') ?? '20';
  if (!/^[1-9][0-9]{0,5}$/.test(pageText) || !/^[1-9][0-9]{0,2}$/.test(limitText)) return null;
  const page = Number(pageText), limit = Number(limitText);
  if (limit > 50) return null;
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) return null;
  return { page, limit, offset };
}
export function validCatalogSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 180 && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(slug);
}
export function validCategoryId(id: string): number | null {
  if (!/^[1-9][0-9]{0,8}$/.test(id)) return null;
  const n = Number(id);
  return Number.isSafeInteger(n) ? n : null;
}


/** Additional public read-only queries; aligned with the original Sequelize models. */
export const PUBLIC_CATEGORY_BY_ID = `SELECT category_id AS id, uuid, name, slug,
 cat_file_id, stock_file_id, prefix, top_category, is_other
 FROM categories WHERE category_id = ? AND is_delete = 0 AND status = 1 LIMIT 1`;
export const PUBLIC_SUBCATEGORY_BY_ID = `SELECT s.sub_category_id AS id, s.uuid, s.name,
 s.slug, s.category, s.file_id FROM sub_categories AS s
 INNER JOIN categories AS c ON c.category_id = s.category
 WHERE s.sub_category_id = ? AND s.is_delete = 0 AND s.status = 1
 AND c.is_delete = 0 AND c.status = 1 LIMIT 1`;
export const PUBLIC_PRODUCT_BY_ID = `SELECT ${PUBLIC_PRODUCT_FIELDS}, p.description,
 p.quantity, p.article_number, p.content FROM products AS p
 WHERE p.product_id = ? AND p.is_delete = 0 AND p.status = 1
 AND p.is_approve = 1 LIMIT 1`;
export const PUBLIC_CATEGORY_COUNT = `SELECT COUNT(*) AS total FROM categories
 WHERE is_delete = 0 AND status = 1`;
export const PUBLIC_SUBCATEGORY_COUNT = `SELECT COUNT(*) AS total FROM sub_categories AS s
 INNER JOIN categories AS c ON c.category_id = s.category
 WHERE s.is_delete = 0 AND s.status = 1
 AND c.is_delete = 0 AND c.status = 1`;
