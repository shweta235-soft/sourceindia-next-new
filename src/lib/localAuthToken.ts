/** Phase 59: local JWT primitives. Not yet wired to the public login endpoints. */
import { createHmac, timingSafeEqual } from "node:crypto";

export type LocalAccountClaim = { id: number; email: string; is_seller: number };
export type LocalAuthClaims = LocalAccountClaim & { iss: "sourceindia-next"; aud: "sourceindia-account"; iat: number; exp: number };
const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
const MAX_TOKEN_LENGTH = 4096;

export function localAuthSecret(raw: string | undefined): string | null {
  if (!raw || raw.length < 32 || Buffer.byteLength(raw, "utf8") < 32 || raw.length > 512 || raw.trim() !== raw) return null;
  // Deny known default/placeholder secrets and trivial repetition.
  if (/^(.)\1{31,}$/.test(raw) || /your_jwt_secret|change.?me|placeholder|example|default|secret_key/i.test(raw)) return null;
  return raw;
}

export function validLocalAccount(value: unknown): value is LocalAccountClaim {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const x = value as Record<string, unknown>;
  return typeof x.id === "number" && Number.isSafeInteger(x.id) && x.id > 0 &&
    typeof x.email === "string" && x.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email) &&
    (x.is_seller === 0 || x.is_seller === 1);
}

function b64url(data: string | Buffer): string { return Buffer.from(data).toString("base64url"); }
function signature(input: string, secret: string): Buffer { return createHmac("sha256", secret).update(input).digest(); }

/** Caller must verify password, active account status and rate limits before issuing. */
export function issueLocalAuthToken(account: LocalAccountClaim, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  if (!localAuthSecret(secret) || !validLocalAccount(account) || !Number.isSafeInteger(nowSeconds) || nowSeconds < 0) throw new Error("Invalid local authentication configuration");
  const claims: LocalAuthClaims = { id: account.id, email: account.email, is_seller: account.is_seller,
    iss: "sourceindia-next", aud: "sourceindia-account", iat: nowSeconds, exp: nowSeconds + 3600 };
  const signingInput = `${header}.${b64url(JSON.stringify(claims))}`;
  return `${signingInput}.${b64url(signature(signingInput, secret))}`;
}

/** Strict verifier for locally issued tokens only; legacy Express tokens are NOT accepted. */
export function verifyLocalAuthToken(token: string, secret: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)): LocalAuthClaims | null {
  if (!localAuthSecret(secret) || typeof token !== "string" || token.length > MAX_TOKEN_LENGTH || !Number.isSafeInteger(nowSeconds)) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== header || !/^[A-Za-z0-9_-]+$/.test(parts[1]) || !/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
  let supplied: Buffer;
  try { supplied = Buffer.from(parts[2], "base64url"); } catch { return null; }
  const expected = signature(`${parts[0]}.${parts[1]}`, secret!);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const raw = Buffer.from(parts[1], "base64url").toString("utf8");
    if (b64url(raw) !== parts[1]) return null;
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const c = obj as Record<string, unknown>;
    // Validate account claims separately from JWT metadata: validLocalAccount
    // narrows its input to LocalAccountClaim, which does not contain JWT fields.
    if (!validLocalAccount(c)) return null;
    const metadata = obj as Record<string, unknown>;
    if (metadata.iss !== "sourceindia-next" || metadata.aud !== "sourceindia-account" ||
      typeof metadata.iat !== "number" || typeof metadata.exp !== "number" ||
      !Number.isSafeInteger(metadata.iat) || !Number.isSafeInteger(metadata.exp) ||
      metadata.iat > nowSeconds + 30 || metadata.exp <= nowSeconds || metadata.exp - metadata.iat !== 3600) return null;
    return c as LocalAuthClaims;
  } catch { return null; }
}
