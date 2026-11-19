import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { homeSections } from "@/lib/adminHomeSettings";

const fields = homeSections.flatMap(({ fields }) => fields.map(([name]) => name));

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view home settings." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The home settings API is not configured." }, 503);

  try {
    const response = await fetch(`${base}/settings/home`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Home settings request failed.");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unexpected home settings data.");
    const settings = data as LeadRecord;
    return json(Object.fromEntries(fields.map((key) => [key, typeof settings[key] === "boolean" ? String(Number(settings[key])) : leadText(settings[key])])));
  } catch {
    return json({ message: "Home settings could not be loaded." }, 502);
  }
}
