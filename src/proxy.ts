import { type NextRequest, NextResponse } from "next/server";
import { adminDashboardPath, adminSessionCookie, readAdminSession, safeAdminDestination } from "@/lib/adminSession";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/session-status" || pathname === "/admin/enquiry-data" || pathname === "/admin/member-data" || pathname === "/admin/support-data" || pathname === "/admin/submission-data" || pathname === "/admin/circular-data" || pathname === "/admin/user-activity-data" || pathname === "/admin/user-history-data" || pathname === "/admin/menu-data" || pathname === "/admin/home-settings-data" || pathname === "/admin/site-settings-data" || pathname === "/admin/mail-history-data" || pathname === "/admin/management-data" || pathname === "/admin/report-data") return NextResponse.next();
  const session = readAdminSession(request.cookies.get(adminSessionCookie)?.value);
  const destination = request.nextUrl.clone();
  destination.search = "";

  if (pathname === "/admin/login") {
    if (!session) return NextResponse.next();
    const target = new URL(safeAdminDestination(request.nextUrl.searchParams.get("returnTo")), destination);
    return NextResponse.redirect(target);
  }
  // API clients must receive an explicit 401, not a redirect to the HTML login page.
  // The individual FAQ handlers also validate the signed admin session.
  const adminFaqApi = pathname === "/admin/api/local/faqs" || pathname.startsWith("/admin/api/local/faqs/");
  if (!session && adminFaqApi) {
    return NextResponse.json(
      { message: "Admin session required." },
      { status: 401, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
    );
  }
  if (!session) {
    destination.pathname = "/admin/login";
    if (pathname !== "/admin") destination.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(destination);
  }
  if (pathname === "/admin") {
    destination.pathname = adminDashboardPath;
    return NextResponse.redirect(destination);
  }
  return NextResponse.next();
}

export const config = { matcher: "/admin/:path*" };
