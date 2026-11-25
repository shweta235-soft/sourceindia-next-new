import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse,adminFaqSameOrigin} from '@/lib/localAdminFaqAuth';
import {ADMIN_TESTIMONIAL_DETAIL,ADMIN_TESTIMONIAL_STATUS_UPDATE,adminTestimonialId,adminTestimonialStatus} from '@/lib/localAdminTestimonials';
import {parseTestimonialWrite,TESTIMONIAL_EDIT,TESTIMONIAL_SOFT_DELETE} from '@/lib/localAdminTestimonialWrite';
import {denyTestimonialWrite,readTestimonialBody,existingTestimonialImage} from '@/lib/localAdminTestimonialWriteHttp';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(req:NextRequest,context:C){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=adminTestimonialId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid testimonial ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [rows]=await db.execute<RowDataPacket[]>(ADMIN_TESTIMONIAL_DETAIL,[id]);
  if(!rows[0])return adminFaqResponse({message:'Testimonial not found.'},404);
  return adminFaqResponse({testimonial:rows[0]});
 }catch{return adminFaqResponse({message:'Testimonial detail unavailable.'},503);}
}
/** Intentionally opt-in and same-origin. Do not enable without explicit user approval and a DB backup. */
export async function PATCH(req:NextRequest,context:C){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(process.env.LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED!=='true')return adminFaqResponse({message:'Testimonial status updates disabled.'},503);
 const id=adminTestimonialId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid testimonial ID.'},400);
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return adminFaqResponse({message:'JSON required.'},415);
 const len=Number(req.headers.get('content-length')??'0');
 if(!Number.isFinite(len)||len>2048)return adminFaqResponse({message:'Payload too large.'},413);
 const raw=await req.text().catch(()=>''),body=raw.length<=2048?(()=>{try{return JSON.parse(raw);}catch{return null;}})():null;
 const status=adminTestimonialStatus(body);
 if(status===null)return adminFaqResponse({message:'status must be 0 or 1.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(ADMIN_TESTIMONIAL_STATUS_UPDATE,[status,id]);
  if(!result.affectedRows)return adminFaqResponse({message:'Testimonial not found.'},404);
  return adminFaqResponse({updated:true,id,status});
 }catch{return adminFaqResponse({message:'Testimonial update unavailable.'},503);}
}

/** Explicit opt-in JSON edit of active/non-deleted row. No file deletion or replacement. */
export async function PUT(req:NextRequest,context:C){
 const denied=denyTestimonialWrite(req);if(denied)return denied;
 const id=adminTestimonialId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid testimonial ID.'},400);
 const data=parseTestimonialWrite(await readTestimonialBody(req));
 if(!data)return adminFaqResponse({message:'Invalid testimonial payload. Use name, description, status (0/1), file_id.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  if(!await existingTestimonialImage(db,data.file_id))return adminFaqResponse({message:'Testimonial image not found.'},400);
  const [result]=await db.execute<ResultSetHeader>(TESTIMONIAL_EDIT,[data.name,data.description,data.status,data.file_id,id]);
  if(!result.affectedRows)return adminFaqResponse({message:'Testimonial not found.'},404);
  return adminFaqResponse({updated:true,id});
 }catch{return adminFaqResponse({message:'Testimonial update unavailable.'},503);}
}
/** Soft-delete only: preserves testimonial and associated upload_images records. */
export async function DELETE(req:NextRequest,context:C){
 const denied=denyTestimonialWrite(req);if(denied)return denied;
 const id=adminTestimonialId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid testimonial ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(TESTIMONIAL_SOFT_DELETE,[id]);
  if(!result.affectedRows)return adminFaqResponse({message:'Testimonial not found.'},404);
  return adminFaqResponse({deleted:true,id});
 }catch{return adminFaqResponse({message:'Testimonial deletion unavailable.'},503);}
}
