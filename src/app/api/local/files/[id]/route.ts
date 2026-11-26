import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { FILE_BY_ID_SQL, validFileId } from '@/lib/localBulk113Files';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = validFileId((await context.params).id);
  if (id === null) return Response.json({ message: 'File not found' }, { status: 404 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(FILE_BY_ID_SQL, [id]);
    if (!rows[0]) return Response.json({ message: 'File not found' }, { status: 404 });
    return Response.json(rows[0], { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'File lookup temporarily unavailable.' }, { status: 503 });
  }
}
