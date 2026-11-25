/** Bulk95: strictly opt-in JSON-only Admin testimonial writes; no filesystem deletion. */
import {randomUUID} from 'node:crypto';
export const TESTIMONIAL_IMAGE_EXISTS = `SELECT upload_image_id AS id FROM upload_images WHERE upload_image_id=? AND file LIKE 'upload/testimonials/%' LIMIT 1`;
export const TESTIMONIAL_CREATE = `INSERT INTO testimonials (uuid,name,description,status,file_id,is_delete,created_at,updated_at) VALUES (?,?,?,?,?,0,NOW(),NOW())`;
export const TESTIMONIAL_EDIT = `UPDATE testimonials SET name=?,description=?,status=?,file_id=?,updated_at=NOW() WHERE testimonial_id=? AND is_delete=0`;
export const TESTIMONIAL_SOFT_DELETE = `UPDATE testimonials SET is_delete=1,updated_at=NOW() WHERE testimonial_id=? AND is_delete=0`;
export type TestimonialFields = {name:string;description:string;status:0|1;file_id:number};
export function parseTestimonialWrite(input:unknown):TestimonialFields|null {
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(',')!=='description,file_id,name,status')return null;
 if(typeof v.name!=='string'||typeof v.description!=='string')return null;
 const name=v.name.trim(),description=v.description.trim();
 if(name.length<1||name.length>255||description.length<1||description.length>30000)return null;
 if(v.status!==0&&v.status!==1)return null;
 if(typeof v.file_id!=='number'||!Number.isSafeInteger(v.file_id)||v.file_id<1)return null;
 return {name,description,status:v.status,file_id:v.file_id};
}
export function newTestimonialUuid(){return randomUUID();}
