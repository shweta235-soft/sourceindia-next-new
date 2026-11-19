import { type NextRequest, NextResponse } from "next/server";
import { adminDashboardPath, adminSessionCookie, readAdminSession, safeAdminDestination } from "@/lib/adminSession";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/enquiry-data" || pathname === "/admin/member-data" || pathname === "/admin/support-data" || pathname === "/admin/submission-data" || pathname === "/admin/circular-data" || pathname === "/admin/user-activity-data" || pathname === "/admin/user-history-data" || pathname === "/admin/menu-data") return NextResponse.next();
  const session = readAdminSession(request.cookies.get(adminSessionCookie)?.value);
  const destination = request.nextUrl.clone();
  destination.search = "";

  if (pathname === "/admin/login") {
    if (!session) return NextResponse.next();
    const target = new URL(safeAdminDestination(request.nextUrl.searchParams.get("returnTo")), destination);
    return NextResponse.redirect(target);
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
