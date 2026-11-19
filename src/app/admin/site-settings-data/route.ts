import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { siteSections } from "@/lib/adminSiteSettings";

const fields = siteSections.flatMap(({ fields }) => fields.filter(([, , type]) => type !== "password").map(([name]) => name));

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view site settings." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The site settings API is not configured." }, 503);

  try {
    const response = await fetch(`${base}/settings/site`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Site settings request failed.");
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unexpected site settings data.");

    const settings = data as LeadRecord;
    return json(Object.fromEntries(fields.map((name) => {
      const value = settings[name];
      if (name === "smtp_tls") {
        if (value === true || value === 1 || value === "1") return [name, "yes"];
        if (value === false || value === 0 || value === "0") return [name, "no"];
      }
      return [name, typeof value === "boolean" ? String(Number(value)) : leadText(value)];
    })));
  } catch {
    return json({ message: "Site settings could not be loaded." }, 502);
  }
}
