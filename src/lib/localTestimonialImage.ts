/** Bulk97: serve only database-linked testimonial media from the dedicated upload folder. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { testimonialImageFormat, MAX_TESTIMONIAL_IMAGE_BYTES } from '@/lib/localAdminTestimonialUpload';

export const PUBLIC_TESTIMONIAL_IMAGE = `SELECT u.file AS file_name FROM testimonials t
 INNER JOIN upload_images u ON u.upload_image_id = t.file_id
 WHERE t.file_id = ? AND t.status = 1 AND t.is_delete = 0 LIMIT 1`;
export const ADMIN_TESTIMONIAL_IMAGE = `SELECT u.file AS file_name FROM testimonials t
 INNER JOIN upload_images u ON u.upload_image_id = t.file_id
 WHERE t.file_id = ? LIMIT 1`;

export function parseTestimonialImageId(raw: string): number | null {
 if (!/^[1-9]\d{0,14}$/.test(raw)) return null;
 const id = Number(raw);
 return Number.isSafeInteger(id) ? id : null;
}

/** Never use a database path as a filesystem path; derive the destination from a vetted basename. */
export function testimonialImageSafeName(value: unknown): string | null {
 if(typeof value !== 'string') return null;
 const normalized = value.replace(/\\/g,'/');
 const match = /^upload\/testimonials\/([A-Za-z0-9_-]{1,100}\.(?:jpg|jpeg|png|webp))$/i.exec(normalized);
 return match ? match[1] : null;
}

export function testimonialImageHeaders(mime: string) {
 return { 'Content-Type': mime, 'Content-Disposition': 'inline',
  'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin' };
}

export async function loadTestimonialImage(fileId: number, admin: boolean): Promise<Response> {
 const db = localAccountDatabase();
 if(!db) return Response.json({message:'Local database unavailable.'},{status:503});
 let value:unknown;
 try {
  const [rows] = await db.execute<RowDataPacket[]>(admin ? ADMIN_TESTIMONIAL_IMAGE : PUBLIC_TESTIMONIAL_IMAGE,[fileId]);
  if(!rows[0]) return Response.json({message:'Image not found.'},{status:404});
  value = rows[0].file_name;
 } catch {return Response.json({message:'Image lookup unavailable.'},{status:503});}
 const name = testimonialImageSafeName(value);
 if(!name) return Response.json({message:'Image not found.'},{status:404});
 try {
  const bytes = await readFile(path.join(process.cwd(),'upload','testimonials',name));
  if(!bytes.length || bytes.length > MAX_TESTIMONIAL_IMAGE_BYTES) return Response.json({message:'Image unavailable.'},{status:404});
  const mime = name.toLowerCase().endsWith('.jpeg')||name.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : name.toLowerCase().endsWith('.png') ? 'image/png':'image/webp';
  const format = testimonialImageFormat(bytes,mime);
  if(!format) return Response.json({message:'Image unavailable.'},{status:404});
  return new Response(new Uint8Array(bytes),{status:200,headers:testimonialImageHeaders(mime)});
 } catch {return Response.json({message:'Image unavailable.'},{status:404});}
}
