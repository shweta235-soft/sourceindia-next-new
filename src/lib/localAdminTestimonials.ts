/** Bulk93: Admin testimonial reads and opt-in status updates. Original Testimonials + UploadImage field mapping. */
export const ADMIN_TESTIMONIAL_LIST = `SELECT t.testimonial_id AS id, t.name, t.description,
 t.file_id, u.file AS file_name, t.status, t.is_delete, t.created_at, t.updated_at
 FROM testimonials t LEFT JOIN upload_images u ON u.upload_image_id = t.file_id
 WHERE t.is_delete = ? ORDER BY t.testimonial_id DESC LIMIT ? OFFSET ?`;
export const ADMIN_TESTIMONIAL_COUNT = 'SELECT COUNT(*) AS total FROM testimonials WHERE is_delete = ?';
export const ADMIN_TESTIMONIAL_DETAIL = `SELECT t.testimonial_id AS id, t.name, t.description,
 t.file_id, u.file AS file_name, t.status, t.is_delete, t.created_at, t.updated_at
 FROM testimonials t LEFT JOIN upload_images u ON u.upload_image_id = t.file_id
 WHERE t.testimonial_id = ? LIMIT 1`;
export const ADMIN_TESTIMONIAL_STATUS_UPDATE = `UPDATE testimonials SET status = ?, updated_at = NOW()
 WHERE testimonial_id = ? AND is_delete = 0`;
export function adminTestimonialId(raw:string):number|null {
 if(!/^[1-9]\d{0,14}$/.test(raw))return null;
 const id=Number(raw);return Number.isSafeInteger(id)?id:null;
}
export function adminTestimonialPaging(url:string){
 const p=new URL(url).searchParams;
 const number=(v:string|null,def:number,max:number)=>{
  if(v===null)return def;
  if(!/^[1-9]\d{0,7}$/.test(v))return null;
  const n=Number(v);return Number.isSafeInteger(n)&&n<=max?n:null;
 };
 const page=number(p.get('page'),1,100000),limit=number(p.get('limit'),20,50);
 if(page===null||limit===null)return null;
 return {page,limit,offset:(page-1)*limit};
}
export function adminTestimonialDeleted(url:string):0|1|null{
 const value=new URL(url).searchParams.get('deleted');
 return value===null||value==='0'?0:value==='1'?1:null;
}
export function adminTestimonialStatus(value:unknown):0|1|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==1||!Object.hasOwn(v,'status'))return null;
 return v.status===0||v.status===1?v.status:null;
}
