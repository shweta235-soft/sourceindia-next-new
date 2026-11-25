import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_CATEGORIES } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET() {
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [categories] = await db.query<RowDataPacket[]>(PUBLIC_CATEGORIES);
    return Response.json({ categories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Categories temporarily unavailable.' }, { status: 503 });
  }
}
