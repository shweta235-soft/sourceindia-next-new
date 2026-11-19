import { createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookie = "si_admin_session";
export const adminDashboardPath = "/admin/dashboard";
export const maxAdminSessionAge = 60 * 60;

export type AdminSession = { id: string; expires: number };

export function adminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : undefined;
}

export function safeAdminDestination(path: unknown) {
  if (typeof path !== "string" || !path.startsWith("/admin/") || path.includes("\\")) {
    return adminDashboardPath;
  }
  try {
    const url = new URL(path, "https://sourceindia.invalid");
    const decodedPath = decodeURIComponent(url.pathname);
    if (!decodedPath.startsWith("/admin/") || decodedPath.includes("\\") || /^\/admin\/login(?:\/|$)/i.test(decodedPath)) {
      return adminDashboardPath;
    }
    return url.pathname + url.search;
  } catch {
    return adminDashboardPath;
  }
}

export function encodeAdminSession(session: AdminSession, secret: string) {
  const data = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function readAdminSession(cookie?: string): AdminSession | undefined {
  const secret = adminSessionSecret();
  if (!secret || !cookie || cookie.length > 2048) return;
  const [data, signature, extra] = cookie.split(".");
  if (!data || !signature || extra !== undefined) return;

  const expected = createHmac("sha256", secret).update(data).digest();
  try {
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return;
    const session: AdminSession = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!session || typeof session.id !== "string" ||
        !Number.isSafeInteger(session.expires) || session.expires <= Math.floor(Date.now() / 1000)) return;
    return session;
  } catch {
    return undefined;
  }
}
