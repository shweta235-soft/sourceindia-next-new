import type { RowDataPacket } from "mysql2";
import { localAccountDatabase } from "@/lib/localAccountDatabase";
import { locationParentId, STATES_BY_COUNTRY_SQL } from "@/lib/localLocationCatalog";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const id = locationParentId(request.url, "countryId");
  if (id === null) return Response.json({ message: "Provide one valid countryId parameter." }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: "Local database not configured." }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(STATES_BY_COUNTRY_SQL, [id]);
    return Response.json({ states: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Location lookup temporarily unavailable." }, { status: 503 });
  }
}
