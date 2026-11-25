import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_TESTIMONIAL_DETAIL, parseTestimonialId } from '@/lib/localTestimonialsPublic';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseTestimonialId(rawId);
  if (id === null) return Response.json({ message: 'Invalid testimonial ID.' }, { status: 400 });
  const db = localAccountDatabase();
  if (!db) return Response.json({ message: 'Local database not configured.' }, { status: 503 });
  try {
    const [rows] = await db.execute<RowDataPacket[]>(PUBLIC_TESTIMONIAL_DETAIL, [id]);
    if (!rows.length) return Response.json({ message: 'Testimonial not found.' }, { status: 404 });
    return Response.json(rows[0], { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Testimonial temporarily unavailable.' }, { status: 503 });
  }
}
