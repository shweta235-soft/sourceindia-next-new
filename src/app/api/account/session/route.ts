import { bearerAuthorization, safeAccountProfile, safeAuthenticationBase } from "@/lib/accountSession";

function respond(status: number, message: string) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Verifies a buyer/seller bearer token against the existing auth service.
 * No new sessions or credentials are issued here; full local auth is a later migration stage. */
export async function GET(request: Request) {
  const authorization = bearerAuthorization(request.headers.get("authorization"));
  if (!authorization) return respond(401, "Please sign in again.");
  const base = safeAuthenticationBase(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (!base) return respond(503, "Authentication service is not configured securely.");
  const endpoint = new URL("signup/profile", base);
  try {
    const upstream = await fetch(endpoint, {
      method: "GET", headers: { Authorization: authorization, Accept: "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.any([request.signal, AbortSignal.timeout(12000)]),
    });
    if (upstream.status === 401 || upstream.status === 403 || upstream.status === 404) return respond(401, "Please sign in again.");
    if (!upstream.ok) return respond(502, "Could not verify the account. Please try again.");
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) return respond(502, "Authentication service returned an unexpected response.");
    const profile = safeAccountProfile(await upstream.json());
    if (!profile) return respond(502, "Authentication service returned an invalid account.");
    return Response.json({ user: profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return respond(502, "Could not reach the authentication service. Please try again.");
  }
}
