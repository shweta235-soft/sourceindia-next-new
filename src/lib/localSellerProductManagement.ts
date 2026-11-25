/** Seller-owned local product management. This does not replace legacy product uploads/workflows. */
const sellerProductWhere = `FROM products AS p
 INNER JOIN users AS u ON u.user_id = p.user_id AND u.company_id = p.company_id
 WHERE u.user_id = ? AND u.is_seller = 1 AND u.status = 1 AND u.is_delete = 0
 AND p.is_delete = 0`;

export const sellerProductDetailSql = `SELECT p.product_id AS id, p.uuid, p.slug, p.title,
 p.code, p.article_number, p.short_description, p.description,
 p.quantity, p.category, p.sub_category, p.file_id,
 p.status, p.is_approve, p.is_featured, p.created_at, p.updated_at
 ${sellerProductWhere} AND p.product_id = ? LIMIT 1`;

export function validSellerProductId(raw: string): number | null {
  if (!/^[1-9][0-9]{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

const editable = ['title', 'code', 'article_number', 'short_description', 'description', 'quantity'] as const;
type Editable = typeof editable[number];
type EditValue = string | number | null;

export function parseSellerProductUpdate(input: unknown): Partial<Record<Editable, EditValue>> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (!keys.length || keys.length > editable.length || keys.some(k => !editable.includes(k as Editable))) return null;
  const output: Partial<Record<Editable, EditValue>> = {};
  for (const k of keys as Editable[]) {
    const value = obj[k];
    if (k === 'quantity') {
      if (value !== null && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1000000000)) return null;
      output[k] = value as number | null;
    } else if (k === 'title' || k === 'short_description') {
      if (typeof value !== 'string' || !value.trim() || value.length > (k === 'title' ? 255 : 20000)) return null;
      output[k] = value.trim();
    } else {
      if (value !== null && (typeof value !== 'string' || value.length > (k === 'description' ? 50000 : 255))) return null;
      output[k] = value as string | null;
    }
  }
  return output;
}

const allowedColumns: Record<Editable, string> = {
  title: 'title', code: 'code', article_number: 'article_number',
  short_description: 'short_description', description: 'description', quantity: 'quantity',
};

/** User/company ownership is enforced in SQL, not from client-supplied IDs. */
export function sellerProductUpdateStatement(fields: Partial<Record<Editable, EditValue>>) {
  const keys = editable.filter(k => Object.prototype.hasOwnProperty.call(fields, k));
  if (!keys.length) throw new Error('No fields supplied');
  return {
    sql: `UPDATE products AS p INNER JOIN users AS u ON u.user_id = p.user_id AND u.company_id = p.company_id
 SET ${keys.map(k => `p.${allowedColumns[k]} = ?`).join(', ')}, p.updated_at = CURRENT_TIMESTAMP
 WHERE p.product_id = ? AND u.user_id = ? AND u.is_seller = 1 AND u.status = 1 AND u.is_delete = 0 AND p.is_delete = 0`,
    values: keys.map(k => fields[k] as EditValue),
  };
}

export const sellerProductSoftDeleteSql = `UPDATE products AS p
 INNER JOIN users AS u ON u.user_id = p.user_id AND u.company_id = p.company_id
 SET p.is_delete = 1, p.updated_at = CURRENT_TIMESTAMP
 WHERE p.product_id = ? AND u.user_id = ? AND u.is_seller = 1
 AND u.status = 1 AND u.is_delete = 0 AND p.is_delete = 0`;
