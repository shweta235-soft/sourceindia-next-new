/** Bulk84: inspect buyer-message destination and validate a proposed message without writes. */
export function validRecipientCompanyId(raw: string): number | null {
  if (!/^[1-9]\d{0,14}$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}
export function parseBuyerMessagePreview(input: unknown): {companyId:number;title:string;message:string}|null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const obj = input as Record<string,unknown>;
  if (Object.keys(obj).some(key => !['company_id','title','message'].includes(key))) return null;
  if (typeof obj.company_id !== 'number' || !Number.isSafeInteger(obj.company_id) || obj.company_id <= 0) return null;
  if (typeof obj.title !== 'string' || typeof obj.message !== 'string') return null;
  const title = obj.title.trim(), message = obj.message.trim();
  if (!title || title.length > 255 || !message || message.length > 255) return null;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(title+message)) return null;
  return {companyId:obj.company_id,title,message};
}
export const buyerRecipientSql = `SELECT u.user_id AS receiver_id, u.company_id,
  c.organization_name, c.organization_slug
  FROM users u INNER JOIN company_info c ON c.company_id = u.company_id
  WHERE u.company_id = ? AND u.is_seller = 1 AND u.is_delete = 0 AND u.status = 1
  ORDER BY u.user_id ASC LIMIT 1`;
