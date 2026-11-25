import type {NextRequest} from 'next/server';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {adminFaqResponse,adminFaqSameOrigin,authorizedAdminFaq} from '@/lib/localAdminFaqAuth';
import {TESTIMONIAL_IMAGE_EXISTS} from '@/lib/localAdminTestimonialWrite';
/** Gate is intentionally independent from the FAQ write flag. */
export function denyTestimonialWrite(req:NextRequest):Response|null {
  if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
  if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
  if(process.env.LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED!=='true')return adminFaqResponse({message:'Testimonial write operations disabled.'},503);
  return null;
}
export async function readTestimonialBody(req:NextRequest):Promise<unknown>{
  if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
  const length=req.headers.get('content-length');
  if(length!==null && (!/^\d+$/.test(length)||Number(length)>35000))return null;
  try{const body=await req.text();if(body.length>35000)return null;return JSON.parse(body);}catch{return null;}
}
export async function existingTestimonialImage(db:Pool,id:number):Promise<boolean>{
  const [rows]=await db.execute<RowDataPacket[]>(TESTIMONIAL_IMAGE_EXISTS,[id]);return rows.length>0;
}
