import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_PRODUCT_BY_ID, validCategoryId } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = validCategoryId(id);
  if (!numericId) return Response.json({ message: 'Invalid product id.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(PUBLIC_PRODUCT_BY_ID, [numericId]);
    if (!rows[0]) return Response.json({ message: 'Product not found.' }, { status: 404 });
    return Response.json({ product: rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Product temporarily unavailable.' }, { status: 503 });
  }
}
