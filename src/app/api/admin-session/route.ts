import { type NextRequest, NextResponse } from "next/server";
import { adminUpstreamExpiry, validUpstreamAdminId } from "@/lib/adminLoginValidation";
import { adminSessionCookie, adminSessionSecret, encodeAdminSession, maxAdminSessionAge, safeAdminDestination } from "@/lib/adminSession";

function response(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: NextRequest) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    return origin.host === request.headers.get("host") && request.headers.get("sec-fetch-site") !== "cross-site"
      && origin.protocol === request.nextUrl.protocol;
  } catch {
    return false;
  }
}

function cookieOptions(request: NextRequest) {
  return { httpOnly: true, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:", path: "/admin" };
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response({ message: "Request origin is not allowed." }, 403);
  const secret = adminSessionSecret();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!secret || !base) return response({ message: "Admin login is not configured. Check the server environment." }, 503);

  const input = await request.json().catch(() => null);
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !password.trim() || password.length > 1024) {
    return response({ message: "Enter a valid email address and password." }, 400);
  }

  try {
    const endpoint = new URL(`${base.replace(/\/+$/, "")}/admin/login`);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname);
    if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && loopback)) {
      return response({ message: "Admin authentication requires an HTTPS API." }, 503);
    }
    const login = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (login.status === 401 || login.status === 403) {
      return response({ message: "Invalid email or password." }, 401);
    }
    if (login.status === 429) return response({ message: "Too many attempts. Try again later." }, 429);
    if (!login.ok) return response({ message: "Admin login is temporarily unavailable." }, 502);

    const { admin, token } = await login.json();
    const adminId = validUpstreamAdminId(admin?.id);
    const now = Math.floor(Date.now() / 1000);
    const upstreamExpiry = adminUpstreamExpiry(token, now);
    if (!adminId || !upstreamExpiry) {
      return response({ message: "Admin login returned an invalid response." }, 502);
    }
    const expires = Math.min(upstreamExpiry, now + maxAdminSessionAge);
    const signed = encodeAdminSession({ id: adminId, expires }, secret);
    const result = response({ destination: safeAdminDestination(input.returnTo) });
    result.cookies.set(adminSessionCookie, signed, { ...cookieOptions(request), maxAge: expires - now });
    return result;
  } catch {
    return response({ message: "Admin login is temporarily unavailable. Please try again." }, 502);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return response({ message: "Request origin is not allowed." }, 403);
  const result = response({ success: true });
  result.cookies.set(adminSessionCookie, "", { ...cookieOptions(request), maxAge: 0 });
  return result;
}
