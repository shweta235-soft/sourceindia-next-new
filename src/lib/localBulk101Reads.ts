/** Bulk101: read-only migrations mapped against the original Sequelize models. */
export const BULK101_SQL = {
 seoList: `SELECT seo_page_id AS id, uuid, title, slug, meta_title, meta_keywords, meta_description, meta_image, created_at, updated_at FROM seo_pages ORDER BY seo_page_id DESC LIMIT ? OFFSET ?`,
 seoCount: `SELECT COUNT(*) AS total FROM seo_pages`,
 seoDetail: `SELECT seo_page_id AS id, uuid, title, slug, meta_title, meta_keywords, meta_description, meta_image, created_at, updated_at FROM seo_pages WHERE seo_page_id = ? LIMIT 1`,
 seoSlug: `SELECT seo_page_id AS id, uuid, title, slug, meta_title, meta_keywords, meta_description, meta_image, created_at, updated_at FROM seo_pages WHERE slug = ? LIMIT 1`,
 ticketsPublic: `SELECT ticket_category_id AS id, name FROM ticket_categories WHERE status = 1 ORDER BY ticket_category_id ASC LIMIT ? OFFSET ?`,
 ticketsPublicCount: `SELECT COUNT(*) AS total FROM ticket_categories WHERE status = 1`,
 ticketsPublicDetail: `SELECT ticket_category_id AS id, name FROM ticket_categories WHERE status = 1 AND ticket_category_id = ? LIMIT 1`,
 ticketsAdmin: `SELECT ticket_category_id AS id, uuid, name, email, status, created_at, updated_at FROM ticket_categories ORDER BY ticket_category_id DESC LIMIT ? OFFSET ?`,
 ticketsAdminCount: `SELECT COUNT(*) AS total FROM ticket_categories`,
 ticketsAdminDetail: `SELECT ticket_category_id AS id, uuid, name, email, status, created_at, updated_at FROM ticket_categories WHERE ticket_category_id = ? LIMIT 1`,
 interestsPublic: `SELECT interest_category_id AS id, uuid, name, color, file_id FROM interest_categories WHERE status = 1 ORDER BY interest_category_id ASC LIMIT ? OFFSET ?`,
 interestsPublicCount: `SELECT COUNT(*) AS total FROM interest_categories WHERE status = 1`,
 interestsPublicDetail: `SELECT interest_category_id AS id, uuid, name, color, file_id FROM interest_categories WHERE status = 1 AND interest_category_id = ? LIMIT 1`,
 interestsAdmin: `SELECT interest_category_id AS id, uuid, name, color, file_id, status, created_at, updated_at FROM interest_categories ORDER BY interest_category_id ASC LIMIT ? OFFSET ?`,
 interestsAdminCount: `SELECT COUNT(*) AS total FROM interest_categories`,
 interestsAdminDetail: `SELECT interest_category_id AS id, uuid, name, color, file_id, status, created_at, updated_at FROM interest_categories WHERE interest_category_id = ? LIMIT 1`,
} as const;
export function bulk101Id(value: string):number|null {
 if(!/^[1-9]\d{0,14}$/.test(value))return null;
 const n=Number(value);return Number.isSafeInteger(n)?n:null;
}
export function bulk101Paging(url:string){
 const u=new URL(url),p=u.searchParams;
 const num=(name:string,def:number,max:number)=>{
  const raw=p.get(name);if(raw===null)return def;
  if(!/^[1-9]\d{0,7}$/.test(raw))return null;
  const n=Number(raw);return Number.isSafeInteger(n)&&n<=max?n:null;
 };
 const page=num('page',1,100000),limit=num('limit',20,50);
 if(page===null||limit===null)return null;
 return {page,limit,offset:(page-1)*limit};
}
export function bulk101Slug(slug:string):string|null {
 const decoded=slug.trim();return decoded.length>0&&decoded.length<=160&&!/[\x00-\x1f]/.test(decoded)?decoded:null;
}
