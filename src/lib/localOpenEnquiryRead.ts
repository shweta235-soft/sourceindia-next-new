/** Bulk80: read-only account-owned open enquiries and received buyer messages. */
export function openEnquiryPagination(url: string): { page: number; limit: number; offset: number } | null {
  let params: URLSearchParams;
  try { params = new URL(url).searchParams; } catch { return null; }
  if ([...params.keys()].some(k => !['page', 'limit'].includes(k) && !k.startsWith('utm_'))) return null;
  if (params.getAll('page').length > 1 || params.getAll('limit').length > 1) return null;
  const p = params.get('page') ?? '1', l = params.get('limit') ?? '20';
  if (!/^[1-9]\d{0,5}$/.test(p) || !/^[1-9]\d{0,2}$/.test(l)) return null;
  const page = Number(p), limit = Number(l);
  if (limit > 50 || !Number.isSafeInteger((page - 1) * limit)) return null;
  return { page, limit, offset: (page - 1) * limit };
}
export const openEnquirySql = {
  count: `SELECT COUNT(*) AS total FROM open_enquriys o WHERE o.user_id = ? AND o.is_delete = 0`,
  list: `SELECT o.open_enquriy_id AS id, o.uuid, o.title, o.description, o.is_home, o.status,
      o.created_at, o.updated_at FROM open_enquriys o
      WHERE o.user_id = ? AND o.is_delete = 0
      ORDER BY o.created_at DESC, o.open_enquriy_id DESC LIMIT ? OFFSET ?`,
  detail: `SELECT o.open_enquriy_id AS id, o.uuid, o.title, o.description, o.is_home, o.status,
      o.created_at, o.updated_at FROM open_enquriys o
      WHERE o.open_enquriy_id = ? AND o.user_id = ? AND o.is_delete = 0 LIMIT 1`,
};
export const incomingMessageSql = {
  count: `SELECT COUNT(*) AS total FROM buyerenquiry b WHERE b.reciever_id = ?`,
  list: `SELECT b.buyerenquiry_id AS id, b.uuid, b.user_id AS sender_id,
      b.title, b.message, b.created_at, b.updated_at
      FROM buyerenquiry b WHERE b.reciever_id = ?
      ORDER BY b.created_at DESC, b.buyerenquiry_id DESC LIMIT ? OFFSET ?`,
};
export function positiveOpenId(value: string): number | null {
  if (!/^[1-9]\d{0,14}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
