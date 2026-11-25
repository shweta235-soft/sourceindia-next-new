/** Bulk90 validated FAQ admin writes. Pure parsers and parameterized SQL. */
import {randomUUID} from 'node:crypto';

export const ADMIN_FAQ_INSERT = `INSERT INTO faqs
 (uuid,title,description,category,status,is_delete,created_at,updated_at)
 VALUES (?,?,?,?,?,0,NOW(),NOW())`;
export const ADMIN_FAQ_EDIT = `UPDATE faqs SET title=?,description=?,category=?,status=?,updated_at=NOW()
 WHERE faq_id=? AND is_delete=0`;
export const ADMIN_FAQ_SOFT_DELETE = `UPDATE faqs SET is_delete=1,updated_at=NOW()
 WHERE faq_id=? AND is_delete=0`;
export const ADMIN_FAQ_CATEGORY_INSERT = `INSERT INTO faqcategories
 (uuid,name,status,created_at,updated_at) VALUES (?,?,?,NOW(),NOW())`;
export const ADMIN_FAQ_CATEGORY_EDIT = `UPDATE faqcategories SET name=?,status=?,updated_at=NOW()
 WHERE faqcategory_id=?`;
export const ADMIN_FAQ_CATEGORY_EXISTS = `SELECT faqcategory_id AS id FROM faqcategories WHERE faqcategory_id=? LIMIT 1`;

export type FaqFields={title:string;description:string;category:number;status:0|1};
export type CategoryFields={name:string;status:0|1};
export function parseFaqWrite(body:unknown):FaqFields|null {
 if(!body || typeof body!=='object' || Array.isArray(body))return null;
 const x=body as Record<string,unknown>;
 if(Object.keys(x).sort().join(',')!=='category,description,status,title')return null;
 if(typeof x.title!=='string'||typeof x.description!=='string')return null;
 const title=x.title.trim(), description=x.description.trim();
 if(title.length<1||title.length>255||description.length<1||description.length>30000)return null;
 if(typeof x.category!=='number'||!Number.isSafeInteger(x.category)||x.category<1)return null;
 if(x.status!==0&&x.status!==1)return null;
 return {title,description,category:x.category,status:x.status};
}
export function parseCategoryWrite(body:unknown):CategoryFields|null {
 if(!body || typeof body!=='object' || Array.isArray(body))return null;
 const x=body as Record<string,unknown>;
 if(Object.keys(x).sort().join(',')!=='name,status')return null;
 if(typeof x.name!=='string')return null;
 const name=x.name.trim();
 if(name.length<1||name.length>255||(x.status!==0&&x.status!==1))return null;
 return {name,status:x.status};
}
export function newFaqUuid(){return randomUUID();}
