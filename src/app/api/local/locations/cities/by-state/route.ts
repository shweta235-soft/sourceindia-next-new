import type { RowDataPacket } from "mysql2";
import { localAccountDatabase } from "@/lib/localAccountDatabase";
import { locationParentId, CITIES_BY_STATE_SQL } from "@/lib/localLocationCatalog";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const id = locationParentId(request.url, "stateId");
  if (id === null) return Response.json({ message: "Provide one valid stateId parameter." }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: "Local database not configured." }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(CITIES_BY_STATE_SQL, [id]);
    return Response.json({ cities: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Location lookup temporarily unavailable." }, { status: 503 });
  }
}
