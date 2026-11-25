/** Bulk83: owner-only message submission, no client supplied sender identity. */
export function validOpenChatMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || typeof input.message !== 'string') return null;
  const message = input.message.trim();
  if (!message || message.length > 2000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(message)) return null;
  return message;
}
export const insertOwnedOpenChatSql = `INSERT INTO open_enquriychats
  (uuid, message, user_id, enquiry_id, enquiry_user_id, reply_user_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;
