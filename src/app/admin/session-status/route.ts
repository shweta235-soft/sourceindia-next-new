import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";

// This route is under /admin so the existing HttpOnly cookie with Path=/admin
// is sent by the browser. Never expose the cookie or user details to public pages.
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const authenticated = Boolean(readAdminSession(request.cookies.get(adminSessionCookie)?.value));
  return NextResponse.json({ authenticated }, {
    headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" },
  });
}
