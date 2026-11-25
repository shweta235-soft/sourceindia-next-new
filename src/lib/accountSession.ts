/** Narrow API contract for account-session verification; never return raw database records. */
export function bearerAuthorization(value: string | null): string | null {
  if (!value || value.length > 8192 || !/^Bearer [A-Za-z0-9._~+/=-]+$/i.test(value)) return null;
  return value;
}

export function safeAccountProfile(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const raw = (payload as Record<string, unknown>).user;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const user = raw as Record<string, unknown>;
  const id = user.id;
  if (!(typeof id === "number" && Number.isSafeInteger(id) && id > 0) &&
    !(typeof id === "string" && /^[1-9]\d{0,15}$/.test(id))) return null;
  const permitted = ["id", "fname", "lname", "email", "is_seller", "status", "file", "company_info", "company_id"];
  const profile: Record<string, unknown> = {};
  for (const field of permitted) {
    if (!(field in user)) continue;
    if (field === "file") {
      const file = user.file;
      if (file && typeof file === "object" && !Array.isArray(file)) {
        const filename = (file as Record<string, unknown>).file;
        if (typeof filename === "string") profile.file = { file: filename };
      }
    } else if (field === "company_info") {
      const company = user.company_info;
      if (company && typeof company === "object" && !Array.isArray(company)) {
        const name = (company as Record<string, unknown>).organization_name;
        profile.company_info = typeof name === "string" ? { organization_name: name } : {};
      }
    } else if (["id", "fname", "lname", "email", "is_seller", "status", "company_id"].includes(field)) {
      const value = user[field];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") profile[field] = value;
    }
  }
  return profile;
}

export function safeAuthenticationBase(raw: string | undefined): URL | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim().replace(/\/+$/, "") + "/");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
    return url;
  } catch { return null; }
}
