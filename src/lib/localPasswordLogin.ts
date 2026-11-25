/** Pure login input and output contract. Does not accept raw SQL or issue tokens. */
export function validLoginInput(value: unknown): { email: string; password: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { email, password } = value as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
      password.length < 1 || password.length > 1024) return null;
  return { email: normalized, password };
}

/** PHP bcrypt $2y$ hashes stored by legacy users remain compatible with bcryptjs. */
export function legacyBcryptHash(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/^\$2y\$/, "$2a$");
  return /^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(normalized) ? normalized : null;
}

export function publicLocalAccount(value: {
  id: number; fname: string; lname: string; email: string; is_seller: number; company_id: number | null;
}) {
  return { id: value.id, fname: value.fname, lname: value.lname, email: value.email,
    is_seller: value.is_seller, company_id: value.company_id };
}
