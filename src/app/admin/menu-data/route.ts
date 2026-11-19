import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import type { MenuItem, MenuList } from "@/lib/adminMenuSettings";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function record(value: unknown): LeadRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LeadRecord : {};
}

function count(value: unknown, fallback: number) {
  const parsed = Number(leadText(value).trim() || "NaN");
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return json({ message: "Please sign in again to view menu settings." }, 401);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return json({ message: "The menu settings API is not configured." }, 503);

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind");
  const parent = params.get("parent");
  if (kind !== "front" && kind !== "shortcut") return json({ message: "Unknown menu." }, 400);
  if (parent !== null && (kind !== "front" || !/^[1-9]\d{0,11}$/.test(parent))) {
    return json({ message: "Invalid parent menu." }, 400);
  }

  async function read(path: string): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Menu service unavailable.");
    return response.json();
  }

  try {
    const path = kind === "shortcut" ? "shortcut/shortcut_menus" : parent ? `front_menu?parent_id=${parent}` : "front_menu";
    const [data, counts] = await Promise.all([
      read(path),
      kind === "front" && !parent ? read("front_menu/count").then(record).catch(() => ({} as LeadRecord)) : {},
    ]);
    const entries = Array.isArray(data) ? data : record(data).data;
    if (!Array.isArray(entries)) throw new Error("Unexpected menu response.");

    const rows = entries.flatMap((value): MenuItem[] => {
      const row = record(value);
      const id = leadText(row.id);
      if (!/^[1-9]\d{0,11}$/.test(id)) return [];
      if (kind === "front" && row.parent_id != null && leadText(row.parent_id) !== (parent ?? "0")) return [];
      return [{
        id, name: leadText(row.name), link: leadText(row.link),
        type: Number(row.type) === 2 ? 2 : 1,
        status: Number(row.status) === 1 ? 1 : 0,
        is_show: Number(row.is_show) === 1 ? 1 : 0,
        position: Math.max(1, count(row.position, 1)),
      }];
    });
    const result: MenuList = {
      rows,
      headerCount: count(record(counts).headerCount, rows.filter(({ type }) => type === 1).length),
      footerCount: count(record(counts).footerCount, rows.filter(({ type }) => type === 2).length),
    };
    return json(result);
  } catch {
    return json({ message: "Menu records could not be loaded." }, 502);
  }
}
