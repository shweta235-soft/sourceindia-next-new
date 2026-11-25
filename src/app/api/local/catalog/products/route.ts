import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { catalogPage, PUBLIC_PRODUCT_COUNT, PUBLIC_PRODUCT_LIST } from '@/lib/localCatalog';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const page = catalogPage(request.url);
  if (!page) return Response.json({ message: 'Invalid pagination.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [counts] = await db.query<(RowDataPacket & { total: number })[]>(PUBLIC_PRODUCT_COUNT);
    const [products] = await db.query<RowDataPacket[]>(`${PUBLIC_PRODUCT_LIST} LIMIT ${page.limit} OFFSET ${page.offset}`);
    return Response.json({ products, pagination: { page: page.page, limit: page.limit, total: Number(counts[0]?.total ?? 0) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Catalog temporarily unavailable.' }, { status: 503 });
  }
}
