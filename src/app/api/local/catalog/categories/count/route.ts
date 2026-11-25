import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_CATEGORY_COUNT } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET() {
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.query<(RowDataPacket & { total: number })[]>(PUBLIC_CATEGORY_COUNT);
    return Response.json({ total: Number(rows[0]?.total ?? 0) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Category count temporarily unavailable.' }, { status: 503 });
  }
}
