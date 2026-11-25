import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_PRODUCT_DETAIL, validCatalogSlug } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!validCatalogSlug(slug)) return Response.json({ message: 'Invalid product slug.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [products] = await db.execute<RowDataPacket[]>(PUBLIC_PRODUCT_DETAIL, [slug]);
    if (!products[0]) return Response.json({ message: 'Product not found.' }, { status: 404 });
    return Response.json({ product: products[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Product temporarily unavailable.' }, { status: 503 });
  }
}
