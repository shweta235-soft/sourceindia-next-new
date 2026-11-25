import type { RowDataPacket } from "mysql2";
import { localAccountDatabase } from "@/lib/localAccountDatabase";
import { COUNTRY_LIST_SQL } from "@/lib/localLocationCatalog";

export const runtime = "nodejs";
export async function GET() {
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: "Local database not configured." }, { status: 503 });
  try {
    const [rows] = await db.query<RowDataPacket[]>(COUNTRY_LIST_SQL);
    return Response.json({ countries: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Location lookup temporarily unavailable." }, { status: 503 });
  }
}
