/** Validate only the shape and expiry of a response from our configured admin API.
 * This is NOT a JWT signature verifier and must never be used to authenticate
 * arbitrary client-provided tokens. The token is received server-to-server
 * from the trusted HTTPS admin login endpoint after successful credentials.
 */
export function validUpstreamAdminId(value: unknown): string | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value === "string" && /^[1-9][0-9]{0,15}$/.test(value)) return value;
  return null;
}

export function adminUpstreamExpiry(token: unknown, now: number): number | null {
  if (typeof token !== "string" || token.length > 8192 || token.length < 20 ||
      !Number.isSafeInteger(now) || now < 0) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part || !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  if (parts[1].length > 4096) return null;
  try {
    const raw = Buffer.from(parts[1], "base64url");
    if (raw.toString("base64url") !== parts[1]) return null;
    const claims: unknown = JSON.parse(raw.toString("utf8"));
    if (!claims || typeof claims !== "object" || Array.isArray(claims)) return null;
    const exp = (claims as Record<string, unknown>).exp;
    if (typeof exp !== "number" || !Number.isSafeInteger(exp) || exp <= now) return null;
    return exp;
  } catch { return null; }
}
