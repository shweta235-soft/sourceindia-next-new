import type {NextRequest} from 'next/server';
import type {ResultSetHeader} from 'mysql2';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminFaqResponse,authorizedAdminFaq,adminFaqSameOrigin} from '@/lib/localAdminFaqAuth';
import {MAX_TESTIMONIAL_IMAGE_BYTES,testimonialImageFormat,testimonialImageFilename,testimonialUploadPath,TESTIMONIAL_UPLOAD_INSERT} from '@/lib/localAdminTestimonialUpload';
export const runtime='nodejs';
/** Standalone image upload, returning file_id for the JSON create/edit routes. Default disabled. */
export async function POST(request:NextRequest){
 if(!authorizedAdminFaq(request))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(request))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(process.env.LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED!=='true'||process.env.LOCAL_ADMIN_TESTIMONIAL_UPLOADS_ENABLED!=='true')
  return adminFaqResponse({message:'Testimonial uploads are disabled.'},503);
 const contentType=request.headers.get('content-type')??'';
 if(!/^multipart\/form-data\s*;/i.test(contentType))return adminFaqResponse({message:'Multipart form-data required.'},415);
 const length=request.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_TESTIMONIAL_IMAGE_BYTES+65536))
  return adminFaqResponse({message:'Upload too large.'},413);
 let form:FormData;
 try{form=await request.formData();}catch{return adminFaqResponse({message:'Invalid multipart form.'},400);}
 if([...form.keys()].some(key=>key!=='file')||form.getAll('file').length!==1)
  return adminFaqResponse({message:'Exactly one file field is required.'},400);
 const file=form.get('file');
 if(!(file instanceof File))return adminFaqResponse({message:'Image file required.'},400);
 if(file.size===0||file.size>MAX_TESTIMONIAL_IMAGE_BYTES)return adminFaqResponse({message:'Image size must be 1 byte to 3 MB.'},413);
 const bytes=new Uint8Array(await file.arrayBuffer());
 const format=testimonialImageFormat(bytes,file.type);
 if(!format)return adminFaqResponse({message:'Only valid JPEG, PNG, and WebP images are supported.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 const filename=testimonialImageFilename(format.extension);
 const relative=testimonialUploadPath(filename);
 const directory=path.join(process.cwd(),'upload','testimonials');
 const absolute=path.join(directory,filename);
 let saved=false;
 try{
  await mkdir(directory,{recursive:true});
  await writeFile(absolute,bytes,{flag:'wx',mode:0o600});saved=true;
  const [result]=await db.execute<ResultSetHeader>(TESTIMONIAL_UPLOAD_INSERT,[randomUUID(),relative]);
  return adminFaqResponse({uploaded:true,file_id:result.insertId,file_name:relative},201);
 }catch{
  if(saved){try{await unlink(absolute);}catch{/* Keep errors generic, do not expose local paths. */}}
  return adminFaqResponse({message:'Testimonial image upload unavailable.'},503);
 }
}
