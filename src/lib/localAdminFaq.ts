/** Bulk89 Admin FAQ read and status SQL; all user inputs are parameterized. */
export const ADMIN_FAQ_LIST = `SELECT f.faq_id AS id, f.title, f.description, f.category,
 c.name AS category_name, f.status, f.is_delete, f.created_at, f.updated_at
 FROM faqs f LEFT JOIN faqcategories c ON c.faqcategory_id = f.category
 WHERE f.is_delete = ? ORDER BY f.faq_id DESC LIMIT ? OFFSET ?`;
export const ADMIN_FAQ_COUNT = 'SELECT COUNT(*) AS total FROM faqs WHERE is_delete = ?';
export const ADMIN_FAQ_DETAIL = `SELECT f.faq_id AS id, f.title, f.description, f.category,
 c.name AS category_name, f.status, f.is_delete, f.created_at, f.updated_at
 FROM faqs f LEFT JOIN faqcategories c ON c.faqcategory_id = f.category
 WHERE f.faq_id = ? LIMIT 1`;
export const ADMIN_FAQ_CATEGORY_LIST = `SELECT faqcategory_id AS id, name, status, created_at, updated_at
 FROM faqcategories ORDER BY faqcategory_id DESC LIMIT ? OFFSET ?`;
export const ADMIN_FAQ_CATEGORY_COUNT = 'SELECT COUNT(*) AS total FROM faqcategories';
export const ADMIN_FAQ_CATEGORY_DETAIL = `SELECT faqcategory_id AS id, name, status, created_at, updated_at
 FROM faqcategories WHERE faqcategory_id = ? LIMIT 1`;
export const ADMIN_FAQ_STATUS_UPDATE = 'UPDATE faqs SET status = ?, updated_at = NOW() WHERE faq_id = ? AND is_delete = 0';
export const ADMIN_FAQ_CATEGORY_STATUS_UPDATE = 'UPDATE faqcategories SET status = ?, updated_at = NOW() WHERE faqcategory_id = ?';
export function faqStatusPayload(value:unknown):0|1|null {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const v=value as Record<string,unknown>;
 if (Object.keys(v).length !== 1 || !Object.hasOwn(v,'status')) return null;
 return v.status===0||v.status===1?v.status:null;
}
export function adminFaqDeleteFlag(url:string):0|1|null {
 const value=new URL(url).searchParams.get('deleted');
 return value===null||value==='0'?0:value==='1'?1:null;
}
export function adminFaqPaging(url:string) {
 const p=new URL(url).searchParams;
 const valid=(v:string|null,def:number,max:number)=>{
  if(v===null)return def;
  if(!/^[1-9]\d{0,7}$/.test(v))return null;
  const n=Number(v);return n<=max?n:null;
 };
 const page=valid(p.get('page'),1,100000);
 const limit=valid(p.get('limit'),20,50);
 return page===null||limit===null?null:{page,limit,offset:(page-1)*limit};
}
export function adminFaqId(raw:string):number|null {
 if(!/^[1-9]\d{0,14}$/.test(raw))return null;
 const n=Number(raw);return Number.isSafeInteger(n)?n:null;
}
