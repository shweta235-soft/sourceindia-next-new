/** BULK119: read-only native Next.js v2 equivalents of five original Express resources.
 * Original source: legacy/sourceindia-express/controllers/{faq,seoPages,testimonial,roles,pages}Controller.js.
 * Only the GET registrations below are overridden; legacy writes stay guarded by BULK117.
 * Response parity must be checked against the original Express app on the SAME isolated DB.
 */
import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';

type Resource = 'faqs' | 'seo_pages' | 'testimonials' | 'roles' | 'pages';
type GridResource = Exclude<Resource,'pages'>;
type Args = Array<string | number | Date>;
const json = (body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unavailable = ()=>json({message:'Local database not configured.'},503);
const failure = ()=>json({message:'Local lookup temporarily unavailable.'},503);
const invalid = ()=>json({message:'Invalid identifier or filter.'},400);
const id = (raw:string):number|null=>/^[1-9]\d{0,14}$/.test(raw)&&Number.isSafeInteger(Number(raw))?Number(raw):null;
const bounded = (value:string|null,fallback:number,max:number):number|null=>value===null?fallback:/^[1-9]\d{0,6}$/.test(value)&&Number(value)<=max?Number(value):null;
const searchValue=(params:URLSearchParams)=>{const value=params.get('search')??'';return value.length<=160?value:null;};
const orderFields:Record<GridResource,Record<string,string>>={
  faqs:{id:'f.faq_id',title:'f.title',description:'f.description',created_at:'f.created_at',updated_at:'f.updated_at',category_name:'fc.name'},
  seo_pages:{id:'s.seo_page_id',title:'s.title',slug:'s.slug',meta_title:'s.meta_title',meta_keywords:'s.meta_keywords',meta_description:'s.meta_description',created_at:'s.created_at',updated_at:'s.updated_at'},
  testimonials:{id:'t.testimonial_id',name:'t.name',description:'t.description',created_at:'t.created_at',updated_at:'t.updated_at'},
  roles:{id:'r.role_id',name:'r.name',created_at:'r.created_at',updated_at:'r.updated_at',category_name:'tc.name'},
};
// The original Sequelize models serialize DATETIME timestamps as UTC ISO-8601.
// mysql2's implicit Date conversion can instead use the Windows local timezone,
// causing a 330-minute difference even though the stored SQL datetime is equal.
// Select these three proven-mismatched fields as ISO text to bypass driver Date
// parsing. Do not apply globally: the other BULK119 and BULK118 date fields match.
// Zero dates are serialized as null, matching the earlier FAQ parity handling.
const legacyUtcDate = (alias:'f'|'s', field:'created_at'|'updated_at') => {
 const column=`${alias}.${field}`;
 return `CASE WHEN ${column} IS NULL OR YEAR(${column})=0 OR MONTH(${column})=0 OR DAYOFMONTH(${column})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(${column}, '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z') END AS ${field}`;
};

const fullColumns:Record<Resource,string>={
  faqs:`f.faq_id AS id,f.uuid,f.title,f.description,f.category,f.status,f.is_delete,${legacyUtcDate('f','created_at')},f.updated_at`,
  seo_pages:`s.seo_page_id AS id,s.uuid,s.title,s.slug,s.meta_title,s.meta_keywords,s.meta_description,s.meta_image,${legacyUtcDate('s','created_at')},${legacyUtcDate('s','updated_at')}`,
  testimonials:'t.testimonial_id AS id,t.uuid,t.name,t.description,t.status,t.file_id,t.is_delete,t.created_at,t.updated_at',
  roles:'r.role_id AS id,r.uuid,r.name,r.ticket_category,r.status,r.is_delete,r.created_at,r.updated_at',
  pages:'p.page_id AS id,p.uuid,p.title,p.description,p.is_edit,p.meta_title,p.meta_keyword,p.meta_description,p.is_delete,p.created_at,p.updated_at',
};
const from:Record<GridResource,string>={
  faqs:'FROM faqs f LEFT JOIN faqcategories fc ON fc.faqcategory_id=f.category',
  seo_pages:'FROM seo_pages s',
  testimonials:'FROM testimonials t LEFT JOIN upload_images ui ON ui.upload_image_id=t.file_id',
  roles:'FROM roles r LEFT JOIN ticket_categories tc ON tc.ticket_category_id=r.ticket_category',
};
const searchSql:Record<GridResource,string>={
  faqs:'(f.title LIKE ? OR f.description LIKE ? OR fc.name LIKE ?)',
  seo_pages:'(s.title LIKE ? OR s.slug LIKE ? OR s.meta_title LIKE ? OR s.meta_keywords LIKE ? OR s.meta_description LIKE ?)',
  testimonials:'(t.name LIKE ? OR t.description LIKE ?)',
  roles:'(r.name LIKE ? OR tc.name LIKE ?)',
};
const baseWhere:Record<GridResource,string>={faqs:'f.is_delete=?',seo_pages:'1=1',testimonials:'1=1',roles:'1=1'};
const fieldCount:Record<GridResource,number>={faqs:3,seo_pages:5,testimonials:2,roles:2};
const detailNotFound:Record<Resource,string>={faqs:'Faq not found',seo_pages:'Seo Pages not found',testimonials:'Testimonials not found',roles:'Roles not found',pages:'Pages not found'};
const primaryTable:Record<Resource,string>={faqs:'faqs f',seo_pages:'seo_pages s',testimonials:'testimonials t',roles:'roles r',pages:'pages p'};
const primaryId:Record<Resource,string>={faqs:'f.faq_id',seo_pages:'s.seo_page_id',testimonials:'t.testimonial_id',roles:'r.role_id',pages:'p.page_id'};
const rowStatus=(value:unknown)=>Number(value)===1?'Active':'Inactive';

export async function getList(resource:GridResource):Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  if(resource==='faqs'){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullColumns.faqs},fc.name AS category_name FROM faqs f
    LEFT JOIN faqcategories fc ON fc.faqcategory_id=f.category AND fc.status=1
    WHERE f.status=1 ORDER BY f.faq_id ASC`);
   return json(rows.map(row=>({...row,getStatus:rowStatus(row.status),category_name:row.category_name??null}))); 
  }
  if(resource==='roles'){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullColumns.roles} FROM roles r ORDER BY r.role_id ASC`);
   return json(rows.map(row=>({...row,getStatus:rowStatus(row.status)})));
  }
  const alias=resource==='seo_pages'?'s':'t';
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullColumns[resource]} FROM ${primaryTable[resource]} ORDER BY ${primaryId[resource]} ${alias==='s'?'DESC':'ASC'}`);
  return json(rows);
 }catch{return failure();}
}

export async function getDetail(resource:Resource,rawId:string):Promise<Response>{
 const parsed=id(rawId);if(parsed===null)return invalid();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const join=resource==='testimonials'?' LEFT JOIN upload_images ui ON ui.upload_image_id=t.file_id':'';
  const fields=resource==='testimonials'?`${fullColumns.testimonials},ui.file AS joined_file`:fullColumns[resource];
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fields} FROM ${primaryTable[resource]}${join} WHERE ${primaryId[resource]}=? LIMIT 1`,[parsed]);
  if(!rows.length)return json({message:detailNotFound[resource]},404);
  if(resource==='testimonials'){
   const {joined_file,...row}=rows[0];return json({...row,UploadImage:joined_file===null||joined_file===undefined?null:{file:joined_file},file_name:joined_file??null});
  }
  return json(rows[0]);
 }catch{return failure();}
}

export async function getSeoBySlug(rawSlug:string):Promise<Response>{
 // Next.js route params already contain the decoded path segment. Do not double-decode.
 const slug=rawSlug;
 if(!slug||slug.length>240||slug.includes('/')||slug.includes('\\')||slug.includes('\0'))return invalid();
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullColumns.seo_pages} FROM seo_pages s WHERE s.slug=? LIMIT 1`,[slug]);
  return rows[0]?json(rows[0]):json({message:'Seo Pages not found'},404);
 }catch{return failure();}
}

export async function getCount(resource:'faqs'|'seo_pages'|'testimonials'):Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  if(resource==='faqs'){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT (SELECT COUNT(*) FROM faqs WHERE is_delete=0) AS faq,(SELECT COUNT(*) FROM faqcategories) AS faqCategory`);
   return json({faq:Number(rows[0]?.faq??0),faqCategory:Number(rows[0]?.faqCategory??0)});
  }
  const table=resource==='seo_pages'?'seo_pages':'testimonials';
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${table}`);
  return json({total:Number(rows[0]?.total??0)});
 }catch{return failure();}
}

function parseDateRange(q:URLSearchParams):{start:Date,end:Date}|null|undefined{
 const range=(q.get('dateRange')??'').toLowerCase().replace(/\s+/g,'');if(!range)return undefined;
 const now=new Date(),today=new Date(now);today.setHours(0,0,0,0);
 const shift=(days:number)=>{const date=new Date(today);date.setDate(date.getDate()-days);return date;};
 const endDay=(date:Date)=>{const copy=new Date(date);copy.setHours(23,59,59,999);return copy;};
 if(range==='today')return{start:today,end:now};
 if(range==='yesterday'){const y=shift(1);return{start:y,end:endDay(y)};}
 if(range==='last7days')return{start:shift(6),end:now};
 if(range==='last30days')return{start:shift(29),end:now};
 if(range==='thismonth')return{start:new Date(today.getFullYear(),today.getMonth(),1),end:now};
 if(range==='lastmonth')return{start:new Date(today.getFullYear(),today.getMonth()-1,1),end:endDay(new Date(today.getFullYear(),today.getMonth(),0))};
 if(range==='customrange'){
  const start=q.get('startDate'),end=q.get('endDate');
  if(!start||!end||!/^(?:19|20)\d\d-\d\d-\d\d$/.test(start)||!/^(?:19|20)\d\d-\d\d$/.test(end))return null;
  const a=new Date(`${start}T00:00:00`),b=new Date(`${end}T00:00:00`);
  if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||a>b)return null;
  return{start:a,end:endDay(b)};
 }
 if(/^\d{1,3}$/.test(range)&&Number(range)>=1&&Number(range)<=365)return{start:shift(Number(range)-1),end:now};
 // Legacy ignores unknown values; do not run unexpected SQL.
 return null;
}

export async function getGrid(req:Request,resource:GridResource):Promise<Response>{
 const q=new URL(req.url).searchParams;
 const page=bounded(q.get('page'),1,100000),limit=bounded(q.get('limit'),10,100),search=searchValue(q);
 if(page===null||limit===null||search===null||!Number.isSafeInteger((page-1)*limit))return invalid();
 const sortBy=q.get('sortBy')??'id';
 const direction=q.get('sort')==='ASC'?'ASC':q.get('sort')==='DESC'?'DESC':'DESC';
 const sort=orderFields[resource][sortBy]??orderFields[resource].id;
 const db=localAccountDatabase();if(!db)return unavailable();
 const clauses:string[]=[baseWhere[resource]];
 const baseArgs:Args=resource==='faqs'?[q.get('getDeleted')==='true'?1:0]:[];
 const searchArgs:Args=[...baseArgs];
 if(search){clauses.push(searchSql[resource]);searchArgs.push(...Array.from({length:fieldCount[resource]},()=>`%${search}%`));}
 if(resource==='faqs'){
  const range=parseDateRange(q);if(range===null)return invalid();
  if(range){clauses.push('f.created_at BETWEEN ? AND ?');searchArgs.push(range.start,range.end);}
 }
 const condition=clauses.join(' AND '),select=resource==='faqs'?`f.faq_id AS id,f.title,f.description,f.category,fc.name AS category_name,f.status,f.is_delete,${legacyUtcDate('f','created_at')},f.updated_at`:
  resource==='seo_pages'?`s.seo_page_id AS id,s.title,s.slug,s.meta_title,s.meta_keywords,s.meta_description,s.meta_image,${legacyUtcDate('s','created_at')},${legacyUtcDate('s','updated_at')}`:
  resource==='testimonials'?`t.testimonial_id AS id,t.name,t.description,t.file_id,ui.file AS file_name,t.status,t.created_at,t.updated_at`:
  `r.role_id AS id,r.name,r.ticket_category,tc.name AS category_name,r.status,r.created_at,r.updated_at`;
 try{
  const [[totals],[filtered],[rows]]=await Promise.all([
   db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from[resource]} WHERE ${baseWhere[resource]}`,baseArgs),
   db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from[resource]} WHERE ${condition}`,searchArgs),
   db.execute<RowDataPacket[]>(`SELECT ${select} ${from[resource]} WHERE ${condition} ORDER BY ${sort} ${direction} LIMIT ? OFFSET ?`,[...searchArgs,limit,(page-1)*limit]),
  ]);
  return json({data:rows,totalRecords:Number(totals[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0)});
 }catch{return failure();}
}
