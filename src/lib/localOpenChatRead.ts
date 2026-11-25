/** Bulk82: account-owned open-enquiry chat read queries. */
export const ownOpenChatQueries = {
  owner: `SELECT o.open_enquriy_id AS id FROM open_enquriys o
    WHERE o.open_enquriy_id = ? AND o.user_id = ? AND o.is_delete = 0 LIMIT 1`,
  count: `SELECT COUNT(*) AS total FROM open_enquriychats c WHERE c.enquiry_id = ?`,
  list: `SELECT c.open_enquriychats_id AS id, c.uuid, c.enquiry_id,
    c.user_id AS sender_id, c.reply_user_id, c.message, c.created_at, c.updated_at
    FROM open_enquriychats c WHERE c.enquiry_id = ?
    ORDER BY c.created_at DESC, c.open_enquriychats_id DESC LIMIT ? OFFSET ?`,
  detail: `SELECT c.open_enquriychats_id AS id, c.uuid, c.enquiry_id,
    c.user_id AS sender_id, c.reply_user_id, c.message, c.created_at, c.updated_at
    FROM open_enquriychats c WHERE c.enquiry_id = ? AND c.open_enquriychats_id = ? LIMIT 1`,
} as const;
export function ownOpenChatId(value: string): number | null {
  if (!/^[1-9]\d{0,14}$/.test(value)) return null;
  const result = Number(value);
  return Number.isSafeInteger(result) ? result : null;
}
export function ownOpenChatPaging(url: string): {page:number;limit:number;offset:number}|null {
  let query: URLSearchParams;
  try { query = new URL(url).searchParams; } catch { return null; }
  if ([...query.keys()].some(key => key !== 'page' && key !== 'limit' && !key.startsWith('utm_'))) return null;
  if (query.getAll('page').length > 1 || query.getAll('limit').length > 1) return null;
  const rawPage = query.get('page') ?? '1', rawLimit = query.get('limit') ?? '20';
  if (!/^[1-9]\d{0,5}$/.test(rawPage) || !/^[1-9]\d{0,2}$/.test(rawLimit)) return null;
  const page = Number(rawPage), limit = Number(rawLimit);
  const offset = (page - 1) * limit;
  return limit <= 50 && Number.isSafeInteger(offset) ? {page, limit, offset} : null;
}
