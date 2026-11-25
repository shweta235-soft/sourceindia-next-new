import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {ADMIN_TESTIMONIAL_LIST,ADMIN_TESTIMONIAL_COUNT,adminTestimonialPaging,adminTestimonialDeleted} from '@/lib/localAdminTestimonials';
import {parseTestimonialWrite,TESTIMONIAL_CREATE,newTestimonialUuid} from '@/lib/localAdminTestimonialWrite';
import {denyTestimonialWrite,readTestimonialBody,existingTestimonialImage} from '@/lib/localAdminTestimonialWriteHttp';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const paging=adminTestimonialPaging(req.url),deleted=adminTestimonialDeleted(req.url);
 if(!paging||deleted===null)return adminFaqResponse({message:'Invalid pagination or deleted filter.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [rows]=await db.execute<RowDataPacket[]>(ADMIN_TESTIMONIAL_LIST,[deleted,paging.limit,paging.offset]);
  const [count]=await db.execute<RowDataPacket[]>(ADMIN_TESTIMONIAL_COUNT,[deleted]);
  return adminFaqResponse({items:rows,total:Number(count[0]?.total??0),page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'Testimonials listing unavailable.'},503);}
}

/** Explicit opt-in JSON create. Requires an existing upload/testimonials image; no file operations. */
export async function POST(req:NextRequest){
 const denied=denyTestimonialWrite(req);if(denied)return denied;
 const data=parseTestimonialWrite(await readTestimonialBody(req));
 if(!data)return adminFaqResponse({message:'Invalid testimonial payload. Use name, description, status (0/1), file_id.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  if(!await existingTestimonialImage(db,data.file_id))return adminFaqResponse({message:'Testimonial image not found.'},400);
  const [result]=await db.execute<ResultSetHeader>(TESTIMONIAL_CREATE,[newTestimonialUuid(),data.name,data.description,data.status,data.file_id]);
  return adminFaqResponse({created:true,id:result.insertId},201);
 }catch{return adminFaqResponse({message:'Testimonial creation unavailable.'},503);}
}
