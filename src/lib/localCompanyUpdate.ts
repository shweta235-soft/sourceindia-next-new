/** Phase 72: scoped company content update. No ownership, slug, membership or media mutations. */
export const editableCompanyFields = [
  "brief_company", "company_location", "designation", "company_email",
  "company_website", "company_phone", "contact_person", "postcode",
  "organization_quality_certification", "company_meta_title",
  "organizations_product_description",
] as const;
export type EditableCompanyField = (typeof editableCompanyFields)[number];
export type LocalCompanyChanges = Partial<Record<EditableCompanyField, string | null>>;
const limits: Record<EditableCompanyField, number> = {
  brief_company: 20000, company_location: 2000, designation: 255,
  company_email: 255, company_website: 255, company_phone: 15,
  contact_person: 255, postcode: 255, organization_quality_certification: 255, company_meta_title: 255,
  organizations_product_description: 20000,
};
const allowed = new Set<string>(editableCompanyFields);

export function parseCompanyUpdate(value: unknown): LocalCompanyChanges | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  if (!keys.length || keys.length > editableCompanyFields.length || keys.some(k => !allowed.has(k))) return null;
  const changes: LocalCompanyChanges = {};
  for (const key of keys) {
    const field = key as EditableCompanyField;
    const raw = input[field];
    if (raw === null) { changes[field] = null; continue; }
    if (typeof raw !== "string") return null;
    const text = raw.trim();
    if (text.length > limits[field] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
    if (field === "company_email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return null;
    if (field === "company_phone" && text && !/^[+0-9()\s-]{5,15}$/.test(text)) return null;
    if (field === "company_website" && text) {
      try {
        const url = new URL(text);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
      } catch { return null; }
    }
    changes[field] = text || null;
  }
  return changes;
}

/** Scope the write to the currently authenticated account's linked, active company. */
export function ownCompanyUpdateSql(changes: LocalCompanyChanges, userId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("Invalid user");
  const fields = editableCompanyFields.filter(f => Object.hasOwn(changes, f));
  if (!fields.length) throw new Error("No changes");
  return {
    sql: `UPDATE company_info AS c INNER JOIN users AS u ON u.company_id = c.company_id SET ${fields.map(f => `c.\`${f}\` = ?`).join(", ")}, c.updated_at = CURRENT_TIMESTAMP WHERE u.user_id = ? AND u.is_delete = 0 AND u.status = 1 AND c.is_delete = 0`,
    params: [...fields.map(f => changes[f] ?? null), userId],
  };
}
