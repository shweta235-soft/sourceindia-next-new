import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_SUBCATEGORIES, validCategoryId } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const categoryId = validCategoryId(id);
  if (!categoryId) return Response.json({ message: 'Invalid category id.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [subcategories] = await db.execute<RowDataPacket[]>(PUBLIC_SUBCATEGORIES, [categoryId]);
    return Response.json({ subcategories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Subcategories temporarily unavailable.' }, { status: 503 });
  }
}
