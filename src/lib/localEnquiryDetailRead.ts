/** Bulk81: parameterized, ownership-scoped detail views. */
export type EnquiryDetailKind = 'sent' | 'received' | 'buyer-messages' | 'incoming-buyer-messages';
export function safeDetailId(raw: string): number | null {
  if (!/^[1-9]\d{0,14}$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}
export function detailKind(raw: string): raw is EnquiryDetailKind {
  return raw === 'sent' || raw === 'received' || raw === 'buyer-messages' || raw === 'incoming-buyer-messages';
}
export const detailQueries: Record<EnquiryDetailKind, string> = {
  sent: `SELECT e.enquiry_id AS id, e.uuid, e.enquiry_number, e.type, e.company_id,
    e.quantity, e.description, e.category_name, e.sub_category_name, e.status, e.is_approve,
    e.created_at, e.updated_at FROM enquiries e
    WHERE e.enquiry_id = ? AND e.user_id = ? AND e.is_delete = 0 LIMIT 1`,
  received: `SELECT e.enquiry_id AS id, e.uuid, e.enquiry_number, e.type,
    e.quantity, e.description, e.category_name, e.sub_category_name, e.status, e.is_approve,
    e.created_at, e.updated_at FROM enquiries e
    WHERE e.enquiry_id = ? AND e.is_delete = 0 AND EXISTS
    (SELECT 1 FROM enquiry_users eu WHERE eu.enquiry_id = e.enquiry_id
    AND eu.company_id = ? AND eu.is_delete = 0) LIMIT 1`,
  'buyer-messages': `SELECT b.buyerenquiry_id AS id, b.uuid, b.title, b.message,
    b.reciever_id AS receiver_id, b.created_at, b.updated_at FROM buyerenquiry b
    WHERE b.buyerenquiry_id = ? AND b.user_id = ? LIMIT 1`,
  'incoming-buyer-messages': `SELECT b.buyerenquiry_id AS id, b.uuid, b.user_id AS sender_id,
    b.title, b.message, b.created_at, b.updated_at FROM buyerenquiry b
    WHERE b.buyerenquiry_id = ? AND b.reciever_id = ? LIMIT 1`,
};
