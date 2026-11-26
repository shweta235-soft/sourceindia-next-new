/** Bulk102: strict JSON management inputs; writes remain opt-in. */
import {randomUUID} from 'node:crypto';
export function bulk102Enabled(){return process.env.LOCAL_ADMIN_BULK102_WRITES_ENABLED==='true';}
export function bulk102Uuid(){return randomUUID();}
export type Bulk102Kind='ticket-categories'|'interest-categories'|'seo-pages';
export function bulk102Object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function exactKeys(o:Record<string,unknown>,expected:string[]){return Object.keys(o).sort().join('|')===expected.slice().sort().join('|');}
export function bulk102Bit(v:unknown):v is 0|1{return v===0||v===1;}
function str(v:unknown,max:number){return typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;}
function nullable(v:unknown,max:number){return v===null||v===''?null:typeof v==='string'&&v.trim().length<=max?v.trim():undefined;}
export type TicketData={name:string;email:string;status:0|1};
export type InterestData={name:string;color:string;file_id:number;status:0|1};
export type SeoData={title:string|null;slug:string;meta_title:string|null;meta_keywords:string|null;meta_description:string|null;meta_image:string|null};
export function parseBulk102(kind:Bulk102Kind,v:unknown):TicketData|InterestData|SeoData|null{
 if(!bulk102Object(v))return null;
 if(kind==='ticket-categories'){
  if(!exactKeys(v,['name','email','status']))return null;
  const name=str(v.name,255),email=str(v.email,255);
  if(!name||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!bulk102Bit(v.status))return null;
  return {name,email,status:v.status};
 }
 if(kind==='interest-categories'){
  if(!exactKeys(v,['name','color','file_id','status']))return null;
  const name=str(v.name,255),color=str(v.color,255);
  if(!name||!color||typeof v.file_id!=='number'||!Number.isSafeInteger(v.file_id)||v.file_id<=0||!bulk102Bit(v.status))return null;
  return {name,color,file_id:v.file_id,status:v.status};
 }
 if(!exactKeys(v,['title','slug','meta_title','meta_keywords','meta_description','meta_image']))return null;
 const slug=str(v.slug,160);
 const title=nullable(v.title,255),meta_title=nullable(v.meta_title,16000),meta_keywords=nullable(v.meta_keywords,16000),meta_description=nullable(v.meta_description,16000),meta_image=nullable(v.meta_image,2048);
 if(!slug||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||[title,meta_title,meta_keywords,meta_description,meta_image].some(v=>v===undefined))return null;
 // Never accept an arbitrary web URL or filesystem path as a local media write.
 if(meta_image && !/^upload\/seo\/[A-Za-z0-9._-]{1,180}$/.test(meta_image))return null;
 return {title:title!,slug,meta_title:meta_title!,meta_keywords:meta_keywords!,meta_description:meta_description!,meta_image:meta_image!};
}
export function parseBulk102Status(v:unknown){return bulk102Object(v)&&exactKeys(v,['status'])&&bulk102Bit(v.status)?v.status:null;}
export const BULK102_SQL={
 'ticket-categories':{
  insert:'INSERT INTO ticket_categories (uuid,name,email,status,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())',
  update:'UPDATE ticket_categories SET name=?,email=?,status=?,updated_at=NOW() WHERE ticket_category_id=?',
  status:'UPDATE ticket_categories SET status=?,updated_at=NOW() WHERE ticket_category_id=?',
 },
 'interest-categories':{
  insert:'INSERT INTO interest_categories (uuid,name,color,file_id,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',
  update:'UPDATE interest_categories SET name=?,color=?,file_id=?,status=?,updated_at=NOW() WHERE interest_category_id=?',
  status:'UPDATE interest_categories SET status=?,updated_at=NOW() WHERE interest_category_id=?',
 },
 'seo-pages':{
  insert:'INSERT INTO seo_pages (uuid,title,slug,meta_title,meta_keywords,meta_description,meta_image,created_at,updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW())',
  update:'UPDATE seo_pages SET title=?,slug=?,meta_title=?,meta_keywords=?,meta_description=?,meta_image=?,updated_at=NOW() WHERE seo_page_id=?',
 },
} as const;
export function bulk102Args(kind:Bulk102Kind,data:TicketData|InterestData|SeoData):Array<string|number|null>{
 if(kind==='ticket-categories'){const v=data as TicketData;return [v.name,v.email,v.status];}
 if(kind==='interest-categories'){const v=data as InterestData;return [v.name,v.color,v.file_id,v.status];}
 const v=data as SeoData;return [v.title,v.slug,v.meta_title,v.meta_keywords,v.meta_description,v.meta_image];
}
