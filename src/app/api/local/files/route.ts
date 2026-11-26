import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { FILES_LIST_SQL } from '@/lib/localBulk113Files';

export const runtime = 'nodejs';
export async function GET() {
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.query<RowDataPacket[]>(FILES_LIST_SQL);
    return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'File lookup temporarily unavailable.' }, { status: 503 });
  }
}
