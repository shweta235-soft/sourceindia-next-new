/** BULK115 read-only admin taxonomy and charts.
 * These local contracts are explicitly NOT 1:1 Express serializations; source
 * mapping is based on original read-only Express controllers/models.
 * Database identifiers are fixed compile-time constants, and input is bound.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

export type AdminFamily='product-categories'|'product-subcategories'|'item-categories'|'item-subcategories'|'product-keywords'|'items';
export type AdminMetric='product'|'seller'|'sourcing';
export type AdminListMode='active'|'all';
const SPEC:Record<AdminFamily,{table:string;key:string;parent:readonly string[];deleted:boolean;productKey?:string}>= {
 'product-categories':{table:'categories',key:'category_id',parent:[],deleted:true,productKey:'category'},
 'product-subcategories':{table:'sub_categories',key:'sub_category_id',parent:['category'],deleted:true,productKey:'sub_category'},
 'item-categories':{table:'item_category',key:'item_category_id',parent:['category_id','subcategory_id'],deleted:true,productKey:'item_category_id'},
 'item-subcategories':{table:'item_subcategory',key:'item_subcategory_id',parent:['category_id','subcategory_id','item_category_id'],deleted:true,productKey:'item_subcategory_id'},
 'product-keywords':{table:'product_keywords',key:'product_keyword_id',parent:['item_subcategory_id'],deleted:false,productKey:'item_subcategory_id'},
 'items':{table:'items',key:'item_id',parent:['category_id','subcategory_id','item_category_id','item_sub_category_id'],deleted:true,productKey:'item_id'},
};
const QUOTE=(name:string)=>'`'+name+'`'; // never interpolate request-controlled identifiers
const check=(req:NextRequest)=>authorizedAdminFaq(req);
const err=(status:number,message:string)=>adminFaqResponse({message},status);
const id=(v:string|undefined)=>v && /^[1-9][0-9]{0,8}$/.test(v)?Number(v):null;
function args(req:NextRequest,extra:string[]=[]) {
 const q=new URL(req.url).searchParams;
 if([...q.keys()].some(k=>!['page','limit','q',...extra].includes(k)))return null;
 if([...q.keys()].some(k=>q.getAll(k).length>1))return null;
 const pn=q.get('page')??'1',ln=q.get('limit')??'50',term=(q.get('q')??'').trim();
 if(!/^[1-9][0-9]{0,3}$/.test(pn)||!/^[1-9][0-9]{0,2}$/.test(ln)||Number(pn)>1000||Number(ln)>100||term.length>100||/[\\\x00-\x1f]/.test(term))return null;
 return {page:Number(pn),limit:Number(ln),term};
}
/** Admin drill-down lists: all=include inactive (not deleted); active=status=1.
 * Returns bounded local {data,pagination}; Express includes associations and
 * sometimes a 404 on empty collections, which is a known parity gap.
 */
export async function bulk115AdminList(req:NextRequest,family:AdminFamily,mode:AdminListMode='active',fixed:readonly string[]=[]) {
 if(!check(req))return err(401,'Admin session required.');
 const s=SPEC[family],paging=args(req);
 if(!paging || fixed.length>s.parent.length || fixed.some(x=>id(x)===null))return err(400,'Invalid taxonomy request.');
 const where:string[]=[];const values:(string|number)[]=[];
 if(s.deleted)where.push('is_delete = 0');
 if(mode==='active')where.push('status = 1');
 for(let i=0;i<fixed.length;i++){where.push(`${QUOTE(s.parent[i])} = ?`);values.push(Number(fixed[i]));}
 if(paging.term){where.push('name LIKE ?');values.push('%'+paging.term+'%');}
 const sqlWhere=where.length?' WHERE '+where.join(' AND '):'';
 const db=localAccountDatabase();if(!db)return err(503,'Local database unavailable.');
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${QUOTE(s.key)} AS id, ${QUOTE('name')}, ${QUOTE('status')} FROM ${QUOTE(s.table)}${sqlWhere} ORDER BY ${QUOTE(s.key)} ASC LIMIT ? OFFSET ?`,[...values,paging.limit,(paging.page-1)*paging.limit]);
  const [cnt]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${QUOTE(s.table)}${sqlWhere}`,values);
  return adminFaqResponse({data:rows,pagination:{page:paging.page,limit:paging.limit,total:Number(cnt[0]?.total??0)}});
 }catch{return err(503,'Admin taxonomy list unavailable.');}
}

/** Admin charts faithfully calculate label groups and the approved/unapproved
 * or unique-user counts used by the original Express controller. 500 labels
 * maximum protects against an accidental huge server payload.
 */
export async function bulk115AdminChart(req:NextRequest,family:AdminFamily,metric:AdminMetric){
 if(!check(req))return err(401,'Admin session required.');
 if([...new URL(req.url).searchParams.keys()].length)return err(400,'Chart accepts no query parameters.');
 const s=SPEC[family],key=s.productKey;
 if(!key)return err(400,'Invalid graph.');
 const metricAllowed=metric==='product'||(metric==='seller'&&['product-categories','product-subcategories'].includes(family))||(metric==='sourcing'&&['item-categories','item-subcategories','product-keywords'].includes(family));
 if(!metricAllowed)return err(400,'Unsupported graph metric.');
 const db=localAccountDatabase();if(!db)return err(503,'Local database unavailable.');
 try{
  const clause=`status = 1${s.deleted?' AND is_delete = 0':''}`;
  const [labels]=await db.execute<RowDataPacket[]>(`SELECT ${QUOTE(s.key)} AS id, name FROM ${QUOTE(s.table)} WHERE ${clause} ORDER BY ${QUOTE(s.key)} ASC LIMIT 500`);
  if(metric==='product'){
   // Original graph product approved group by target taxonomy id; product
   // keyword bar graph also groups by item_subcategory_id, not keyword ID.
   const [values]=await db.execute<RowDataPacket[]>(`SELECT ${QUOTE(key)} AS id, SUM(CASE WHEN is_approve = 1 THEN 1 ELSE 0 END) AS approved, SUM(CASE WHEN is_approve = 0 THEN 1 ELSE 0 END) AS unapproved FROM products WHERE is_delete = 0 GROUP BY ${QUOTE(key)}`);
   const m=new Map(values.map(x=>[Number(x.id),x]));
   return adminFaqResponse({labels:labels.map(r=>r.name),datasets:[
    {label:'Approved',backgroundColor:'#4CAF50',data:labels.map(r=>Number(m.get(Number(r.id))?.approved??0))},
    {label:'Unapproved',backgroundColor:'#FF5722',data:labels.map(r=>Number(m.get(Number(r.id))?.unapproved??0))}
   ]});
  }
  const col=metric==='seller'?(family==='product-categories'?'category_id':'subcategory_id'):'item_'+(family==='item-categories'?'category_id':'subcategory_id');
  const table=metric==='seller'?'seller_categories':'buyer_sourcing_interests';
  const [values]=await db.execute<RowDataPacket[]>(`SELECT ${QUOTE(col)} AS id, COUNT(DISTINCT user_id) AS total FROM ${QUOTE(table)} GROUP BY ${QUOTE(col)}`);
  const m=new Map(values.map(x=>[Number(x.id),Number(x.total)]));
  return adminFaqResponse({labels:labels.map(r=>r.name),datasets:[{label:metric==='seller'?'Sellers':'Sourcing Interests',data:labels.map(r=>m.get(Number(r.id))??0),backgroundColor:metric==='seller'?'#0d6efd':'#0d6efd'}]});
 }catch{return err(503,'Admin chart unavailable.');}
}

const extra:Record<string,{table:string;id:string;name:string;deleted:boolean}>= {
 'ticket-categories':{table:'ticket_categories',id:'ticket_category_id',name:'name',deleted:false},
 'testimonials':{table:'testimonials',id:'testimonial_id',name:'name',deleted:true},
 'faq-categories':{table:'faqcategories',id:'faqcategory_id',name:'name',deleted:false},
 'faqs':{table:'faqs',id:'faq_id',name:'title',deleted:true},
 'knowledge-center':{table:'knowledge_centers',id:'knowledge_center_id',name:'name',deleted:true},
 'interest-categories':{table:'interest_categories',id:'interest_category_id',name:'name',deleted:false},
 'seo-pages':{table:'seo_pages',id:'seo_page_id',name:'title',deleted:false},
 'front-menu':{table:'front_menu',id:'front_menu_id',name:'name',deleted:false},
};
/** Local admin server-side response, NOT legacy DataTables JSON parity. */
export async function bulk115AdminServer(req:NextRequest,kind:string,onlyCount=false){
 if(!check(req))return err(401,'Admin session required.');
 const x=extra[kind];if(!x)return err(404,'Unknown admin resource.');
 const paging=args(req);if(!paging)return err(400,'Invalid pagination.');
 const where=(x.deleted?['is_delete = 0']:[]),params:(string|number)[]=[];
 if(paging.term){where.push(`${QUOTE(x.name)} LIKE ?`);params.push('%'+paging.term+'%');}
 const clause=where.length?' WHERE '+where.join(' AND '):'';
 const db=localAccountDatabase();if(!db)return err(503,'Local database unavailable.');
 try{
  const [total]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${QUOTE(x.table)}${clause}`,params);
  if(onlyCount)return adminFaqResponse({total:Number(total[0]?.total??0)});
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${QUOTE(x.id)} AS id, ${QUOTE(x.name)} AS name FROM ${QUOTE(x.table)}${clause} ORDER BY ${QUOTE(x.id)} DESC LIMIT ? OFFSET ?`,[...params,paging.limit,(paging.page-1)*paging.limit]);
  return adminFaqResponse({data:rows,totalRecords:Number(total[0]?.total??0),filteredRecords:Number(total[0]?.total??0),page:paging.page,limit:paging.limit});
 }catch{return err(503,'Admin listing unavailable.');}
}

/** Keyword list by actual keyword parent; with usage flags from source function. */
export async function bulk115KeywordsForSubcategory(req:NextRequest,rawId:string) {
 if(!check(req))return err(401,'Admin session required.');
 const parent=id(rawId),paging=args(req);
 if(parent===null||!paging)return err(400,'Invalid item subcategory or pagination.');
 const db=localAccountDatabase();if(!db)return err(503,'Local database unavailable.');
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT product_keyword_id AS id,name,status,is_main,created_at,updated_at FROM product_keywords WHERE item_subcategory_id = ? ORDER BY product_keyword_id ASC LIMIT ? OFFSET ?`,[parent,paging.limit,(paging.page-1)*paging.limit]);
  const [total]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM product_keywords WHERE item_subcategory_id = ?`,[parent]);
  const [usage]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM products WHERE item_subcategory_id = ?`,[parent]);
  let usedIds=new Set<number>();
  if(rows.length&&Number(usage[0]?.total??0)===0){
   const ids=rows.map(r=>Number(r.id));
   const [used]=await db.execute<RowDataPacket[]>(`SELECT DISTINCT keyword_id AS id FROM products WHERE keyword_id IN (${ids.map(()=>'?').join(',')})`,ids);
   usedIds=new Set(used.map(r=>Number(r.id)));
  }
  return adminFaqResponse({data:rows.map(r=>({...r,is_used:Number(usage[0]?.total??0)>0||usedIds.has(Number(r.id))})),pagination:{page:paging.page,limit:paging.limit,total:Number(total[0]?.total??0)}});
 }catch{return err(503,'Keyword hierarchy unavailable.');}
}
