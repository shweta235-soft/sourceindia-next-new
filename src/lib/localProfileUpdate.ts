/** Phase 69: deliberately narrow basic-profile update; no email, files, company or notification writes. */
export const editableProfileFields = ["fname", "lname", "mobile", "alternate_number", "address", "zipcode", "website"] as const;
export type EditableProfileField = (typeof editableProfileFields)[number];
export type BasicProfileChanges = Partial<Record<EditableProfileField, string | null>>;
const limits: Record<EditableProfileField, number> = {
  fname: 100, lname: 100, mobile: 30, alternate_number: 30, address: 2000, zipcode: 25, website: 255,
};
const optional = new Set<EditableProfileField>(["mobile", "alternate_number", "address", "zipcode", "website"]);
const fieldSet = new Set<string>(editableProfileFields);

export function parseBasicProfileUpdate(value: unknown): BasicProfileChanges | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  if (!keys.length || keys.length > editableProfileFields.length || keys.some(k => !fieldSet.has(k) || k === "__proto__")) return null;
  const result: BasicProfileChanges = {};
  for (const key of keys) {
    const field = key as EditableProfileField;
    const raw = input[key];
    if (raw === null && optional.has(field)) { result[field] = null; continue; }
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (trimmed.length > limits[field] || /[\u0000-\u001f\u007f]/.test(trimmed)) return null;
    if (!optional.has(field) && !trimmed) return null;
    if (field === "website" && trimmed && (!/^https?:\/\//i.test(trimmed) || (() => { try { const url = new URL(trimmed); return !["http:", "https:"].includes(url.protocol) || !!url.username || !!url.password; } catch { return true; } })())) return null;
    if ((field === "mobile" || field === "alternate_number") && trimmed && !/^[+0-9()\s-]{5,30}$/.test(trimmed)) return null;
    if (field === "zipcode" && trimmed && !/^[a-zA-Z0-9 -]{2,25}$/.test(trimmed)) return null;
    result[field] = trimmed || (optional.has(field) ? null : trimmed);
  }
  return result;
}

/** All column identifiers come from a fixed code allowlist, never from arbitrary JSON. */
export function basicProfileUpdateSql(changes: BasicProfileChanges, userId: number): { sql: string; params: (string | number | null)[] } {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("Invalid user");
  const fields = editableProfileFields.filter(field => Object.hasOwn(changes, field));
  if (!fields.length) throw new Error("No changes");
  return {
    sql: `UPDATE users SET ${fields.map(field => `\`${field}\` = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_delete = 0 AND status = 1`,
    params: [...fields.map(field => changes[field] ?? null), userId],
  };
}
