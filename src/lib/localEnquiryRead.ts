/** Bulk79: account-scoped, read-only enquiry / buyer message contracts. */
export type EnquiryKind = 'sent' | 'received' | 'buyer-messages';

export function parseEnquiryPaging(url: string): { limit: number; offset: number; page: number } | null {
  let params: URLSearchParams;
  try { params = new URL(url).searchParams; } catch { return null; }
  if ([...params.keys()].some(k => k !== 'page' && k !== 'limit' && !k.startsWith('utm_'))) return null;
  if (params.getAll('page').length > 1 || params.getAll('limit').length > 1) return null;
  const p = params.get('page') ?? '1';
  const l = params.get('limit') ?? '20';
  if (!/^[1-9]\d{0,5}$/.test(p) || !/^[1-9]\d{0,2}$/.test(l)) return null;
  const page = Number(p), limit = Number(l);
  if (limit > 50 || !Number.isSafeInteger((page - 1) * limit)) return null;
  return { page, limit, offset: (page - 1) * limit };
}

// Never SELECT *: only fields needed by the account-facing UI.
export const enquiryQueries: Record<EnquiryKind, { count: string; list: string }> = {
  sent: {
    count: `SELECT COUNT(*) AS total FROM enquiries e WHERE e.user_id = ? AND e.is_delete = 0`,
    list: `SELECT e.enquiry_id AS id, e.uuid, e.enquiry_number, e.type, e.company_id,
      e.quantity, e.description, e.category_name, e.sub_category_name, e.status,
      e.is_approve, e.created_at, e.updated_at
      FROM enquiries e WHERE e.user_id = ? AND e.is_delete = 0
      ORDER BY e.created_at DESC, e.enquiry_id DESC LIMIT ? OFFSET ?`,
  },
  received: {
    // Distinct avoids duplicate enquiries if a company has multiple enquiry_users rows.
    count: `SELECT COUNT(DISTINCT e.enquiry_id) AS total FROM enquiries e
      INNER JOIN enquiry_users eu ON eu.enquiry_id = e.enquiry_id AND eu.is_delete = 0
      WHERE eu.company_id = ? AND e.is_delete = 0`,
    list: `SELECT DISTINCT e.enquiry_id AS id, e.uuid, e.enquiry_number, e.type,
      e.quantity, e.description, e.category_name, e.sub_category_name, e.status,
      e.is_approve, e.created_at, e.updated_at
      FROM enquiries e INNER JOIN enquiry_users eu ON eu.enquiry_id = e.enquiry_id AND eu.is_delete = 0
      WHERE eu.company_id = ? AND e.is_delete = 0
      ORDER BY e.created_at DESC, e.enquiry_id DESC LIMIT ? OFFSET ?`,
  },
  'buyer-messages': {
    count: `SELECT COUNT(*) AS total FROM buyerenquiry b WHERE b.user_id = ?`,
    list: `SELECT b.buyerenquiry_id AS id, b.uuid, b.title, b.message, b.reciever_id AS receiver_id,
      b.created_at, b.updated_at FROM buyerenquiry b WHERE b.user_id = ?
      ORDER BY b.created_at DESC, b.buyerenquiry_id DESC LIMIT ? OFFSET ?`,
  },
};

export function validEnquiryKind(value: string): value is EnquiryKind {
  return value === 'sent' || value === 'received' || value === 'buyer-messages';
}
