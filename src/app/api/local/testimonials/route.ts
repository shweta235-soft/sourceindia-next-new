import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_TESTIMONIAL_LIST, parseTestimonialPaging } from '@/lib/localTestimonialsPublic';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const paging = parseTestimonialPaging(request.url);
  if (!paging) return Response.json({ message: 'Invalid pagination.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(PUBLIC_TESTIMONIAL_LIST, [paging.limit, paging.offset]);
    return Response.json({ items: rows, page: paging.page, limit: paging.limit }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Testimonials temporarily unavailable.' }, { status: 503 });
  }
}
