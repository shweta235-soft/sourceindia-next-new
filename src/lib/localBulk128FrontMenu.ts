/** BULK128: native Front Menu read/write routes; original Express is read-only reference.
 * Mutations require an isolated QA database and a dedicated, long bearer token.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers});
const failure=()=>respond({message:'Front menu unavailable.'},503);
const invalid=()=>respond({message:'Invalid request.'},400);
const parseId=(raw:string)=>/^[1-9]\d{0,14}$/.test(raw)&&Number.isSafeInteger(Number(raw))?Number(raw):null;
// Explicit UTC ISO serialization matches Sequelize's JSON date shape without
// relying on mysql2 Date parsing in the host machine's local timezone.
const sqlUtcDate=(field:'created_at'|'updated_at')=>
 `CASE WHEN ${field} IS NULL OR YEAR(${field})=0 OR MONTH(${field})=0 OR DAYOFMONTH(${field})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(${field}, '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z') END AS ${field}`;
const col=`front_menu_id AS id,uuid,parent_id,name,link,is_show,status,type,position,${sqlUtcDate('created_at')},${sqlUtcDate('updated_at')}`;
const safeLike=(s:string)=>s.replace(/[\\%_]/g,c=>'\\'+c);
const sorts:Record<string,string>={id:'front_menu_id',parent_id:'parent_id',name:'name',link:'link',is_show:'is_show',status:'status',type:'type',created_at:'created_at',updated_at:'updated_at'};
function db(){return localAccountDatabase();}
export function buildMenuHierarchy(rows:Record<string,unknown>[]){
 const map=new Map<number,Record<string,unknown>>();
 const result:Record<string,unknown>[]=[];
 for(const item of rows){item.sub_menu=[];map.set(Number(item.id),item);}
 for(const item of rows){const parent=Number(item.parent_id);if(parent===0)result.push(item);else if(map.has(parent))(map.get(parent)!.sub_menu as Record<string,unknown>[]).push(item);}
 return result;
}
export async function getMenus(){
 const pool=db();if(!pool)return failure();
 try{const [rows]=await pool.query<RowDataPacket[]>(`SELECT ${col} FROM front_menu ORDER BY type ASC,position ASC`);
  return respond(buildMenuHierarchy(rows.map(x=>({...x}))));}catch{return failure();}
}
export async function getMenuCount(){
 const pool=db();if(!pool)return failure();
 try{const [rows]=await pool.query<RowDataPacket[]>(`SELECT COUNT(CASE WHEN type=1 AND parent_id=0 THEN 1 END) AS headerCount,COUNT(CASE WHEN type=2 AND parent_id=0 THEN 1 END) AS footerCount FROM front_menu`);
  return respond({headerCount:Number(rows[0]?.headerCount??0),footerCount:Number(rows[0]?.footerCount??0)});}catch{return failure();}
}
export async function getMenuDetail(raw:string){
 const id=parseId(raw);if(!id)return invalid();const pool=db();if(!pool)return failure();
 try{const [rows]=await pool.execute<RowDataPacket[]>(`SELECT ${col} FROM front_menu WHERE front_menu_id=? LIMIT 1`,[id]);return rows.length?respond(rows[0]):respond({message:'Front menu not found'},404);}catch{return failure();}
}
export async function getMenuGrid(req:NextRequest){
 const params=req.nextUrl.searchParams;
 const p=params.get('page')??'1',l=params.get('limit')??'10';
 if(!/^[1-9]\d{0,5}$/.test(p)||!/^[1-9]\d{0,3}$/.test(l))return invalid();
 const page=Number(p),limit=Number(l),offset=(page-1)*limit;
 if(limit>200||!Number.isSafeInteger(offset))return invalid();
 const search=params.get('search')??'';if(search.length>150)return invalid();
 const sort=params.get('sort')??'DESC';const direction=sort==='ASC'||sort==='DESC'?sort:'ASC';
 const sortBy=params.get('sortBy')??'id';const order=sorts[sortBy]??'front_menu_id';
 const args=search?[`%${safeLike(search)}%`,`%${safeLike(search)}%`]:[];
 const where=search?' WHERE name LIKE ? OR link LIKE ?':'';
 const pool=db();if(!pool)return failure();
 try{
  const [total]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM front_menu');
  const [filtered]=search?await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM front_menu${where}`,args):[total];
  const [rows]=await pool.query<RowDataPacket[]>(`SELECT front_menu_id AS id,parent_id,name,link,is_show,status,type,${sqlUtcDate('created_at')},${sqlUtcDate('updated_at')} FROM front_menu${where} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...args,limit,offset]);
  return respond({data:rows,totalRecords:Number(total[0]?.n??0),filteredRecords:Number(filtered[0]?.n??0)});
 }catch{return failure();}
}

export function frontMenuWriteGate(req:NextRequest,e:NodeJS.ProcessEnv=process.env):Response|null{
 if(e.NODE_ENV==='production'||e.SOURCEINDIA_FRONT_MENU_WRITES_ENABLED!=='1')return respond({message:'Front Menu writes disabled.'},403);
 if(!['localhost','127.0.0.1','::1'].includes((e.DB_HOST??'').toLowerCase()))return respond({message:'Isolated QA database required.'},403);
 const name=e.DB_NAME??'';
 if(!name||name!==e.SOURCEINDIA_FRONT_MENU_QA_DB_NAME||!/(qa|test|sandbox)/i.test(name))return respond({message:'Isolated QA database required.'},403);
 const secret=e.SOURCEINDIA_FRONT_MENU_QA_TOKEN??'',a=req.headers.get('authorization')??'',provided=a.startsWith('Bearer ')?a.slice(7):'';
 if(secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(secret),Buffer.from(provided)))return respond({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return respond({message:'Origin denied.'},403);}catch{return respond({message:'Origin denied.'},403);}}
 return null;
}
async function getBody(req:NextRequest){
 const contentType=req.headers.get('content-type')??'';
 const len=Number(req.headers.get('content-length')??'0');if(!Number.isFinite(len)||len>16000)return null;
 try{
  if(contentType.startsWith('application/json')){
   const v:unknown=await req.json();return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
  }
  // Express accepts URL-encoded form submissions. Reject duplicate keys rather
  // than resolving them ambiguously in a state-changing endpoint.
  if(contentType.startsWith('application/x-www-form-urlencoded')){
   const body=await req.text();if(body.length>16000)return null;
   const out:Record<string,unknown>={};
   for(const [key,value] of new URLSearchParams(body)){
    if(Object.hasOwn(out,key))return null;
    out[key]=value;
   }
   return out;
  }
  return null;
 }catch{return null;}
}
const smallInteger=(value:unknown)=>{
 if(typeof value==='number')return Number.isSafeInteger(value)&&value>=0?value:null;
 if(typeof value==='string'&&/^(0|[1-9]\d{0,14})$/.test(value)){
  const n=Number(value);return Number.isSafeInteger(n)?n:null;
 }
 return null;
};
// Sequelize INTEGER is a signed MySQL INT; model does not disallow negatives.
// Keep values in DB range instead of silently overflowing/truncating.
const signedInt=(value:unknown)=>{
 if(typeof value==='number')return Number.isInteger(value)&&value>=-2147483648&&value<=2147483647?value:null;
 if(typeof value==='string'&&/^-?(0|[1-9]\d{0,9})$/.test(value)){
  const n=Number(value);return Number.isInteger(n)&&n>=-2147483648&&n<=2147483647?n:null;
 }
 return null;
};
const flag=(x:unknown)=>{const n=smallInteger(x);return n===0||n===1?n:null;};
type MenuFields={parent_id:number;name:string;link:string;is_show:number;status:number;type:number;position:number};
function input(v:Record<string,unknown>|null,previous?:Record<string,unknown>|null):MenuFields|null{
 if(!v)return null;
 const merged:Record<string,unknown>={...previous,...v};
 // FrontMenu Sequelize model defaults, not custom API requirements.
 if(merged.parent_id===undefined)merged.parent_id=0;
 if(merged.position===undefined)merged.position=0;
 const {name,link}=merged;
 const parent=signedInt(merged.parent_id),position=signedInt(merged.position);
 const menuType=signedInt(merged.type),visible=flag(merged.is_show),status=flag(merged.status);
 if(typeof name!=='string'||!name.trim()||name.length>255||typeof link!=='string'||link.length>10000||
    parent===null||position===null||menuType===null||visible===null||status===null)return null;
 return {parent_id:parent,name,link,is_show:visible,status,type:menuType!,position};
}
async function transaction<T>(fn:(conn:PoolConnection)=>Promise<T>):Promise<T>{
 const pool=db();if(!pool)throw Error('NO_DB');const conn=await pool.getConnection();
 try{await conn.beginTransaction();const result=await fn(conn);await conn.commit();return result;}catch(err){await conn.rollback();throw err;}finally{conn.release();}
}
async function byId(conn:PoolConnection,id:number){const [rows]=await conn.execute<RowDataPacket[]>(`SELECT ${col} FROM front_menu WHERE front_menu_id=? LIMIT 1 FOR UPDATE`,[id]);return rows[0]??null;}
export async function createMenu(req:NextRequest){
 const guard=frontMenuWriteGate(req);if(guard)return guard;const data=input(await getBody(req));if(!data)return invalid();
 try{const item=await transaction(async conn=>{
  const [result]=await conn.execute<ResultSetHeader>('INSERT INTO front_menu (uuid,parent_id,name,link,is_show,status,type,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())',[randomUUID(),data.parent_id,data.name,data.link,data.is_show,data.status,data.type,data.position]);
  return byId(conn,result.insertId);
 });return item?respond({message:'Front menu created',frontMenu:item},201):respond({message:'Parent front menu not found'},404);}catch{return failure();}
}
export async function updateMenu(req:NextRequest,raw:string){
 const guard=frontMenuWriteGate(req);if(guard)return guard;const id=parseId(raw);if(!id)return invalid();
 const payload=await getBody(req);if(!payload)return invalid();
 try{return await transaction(async conn=>{
  const existing=await byId(conn,id);
  if(!existing)return respond({message:'Front menu not found'},404);
  // Express assigns individual fields; omitted fields retain their old values.
  const data=input(payload,existing);
  if(!data)return invalid();
  await conn.execute('UPDATE front_menu SET parent_id=?,name=?,link=?,is_show=?,status=?,type=?,position=?,updated_at=NOW() WHERE front_menu_id=?',[data.parent_id,data.name,data.link,data.is_show,data.status,data.type,data.position,id]);
  return respond({message:'Front menu updated',frontMenu:await byId(conn,id)});
 });}catch{return failure();}
}
export async function updateMenuFlag(req:NextRequest,raw:string,key:'status'|'is_show'){
 const guard=frontMenuWriteGate(req);if(guard)return guard;const id=parseId(raw);if(!id)return invalid();const v=await getBody(req);const value=(typeof v?.[key]==='number'&&(v[key]===0||v[key]===1))?v[key] as number:null;
 if(value===null)return respond({message:key==='status'?'Invalid status. Use 1 (Active) or 0 (Deactive).':'Invalid is_show. Use 1 (yes) or 0 (No).'},400);
 try{return await transaction(async conn=>{
  if(!await byId(conn,id))return respond({message:'Faq Category not found'},404);
  await conn.execute(`UPDATE front_menu SET ${key}=?,updated_at=NOW() WHERE front_menu_id=?`,[value,id]);
  return respond({message:key==='status'?'Status updated':'Show status updated',frontMenu:await byId(conn,id)});
 });}catch{return failure();}
}
export async function deleteMenu(req:NextRequest,raw:string){
 const guard=frontMenuWriteGate(req);if(guard)return guard;const id=parseId(raw);if(!id)return invalid();
 try{return await transaction(async conn=>{
  if(!await byId(conn,id))return respond({message:'Front menu not found'},404);
  // Original Express destroy() does not cascade children. This behavior is QA-only.
  await conn.execute('DELETE FROM front_menu WHERE front_menu_id=?',[id]);return respond({message:'Front menu deleted successfully'});
 });}catch{return failure();}
}
/** Equivalent response mapper for the legacy POST main-search route. No writes. */
export async function mainSearch(req:NextRequest){
 const p=req.nextUrl.searchParams,q=p.get('q')??'',type=p.get('type')??'';
 if(!q||q.length<2)return respond([]);
 if(q.length>140||/[\x00-\x1f]/.test(q))return invalid();
 if(!['product','seller','buyer'].includes(type))return respond([]);
 const pool=db();if(!pool)return failure();
 const pattern=`%${safeLike(q)}%`;
 type SearchResult={id:number;name:string;type:string;search_type:string;category_id:number;subcategory_id:number;item_category_id:number;item_subcategory_id:number;slug?:string;keyword_id?:number;url?:string};
 const make=(id:number,name:string,itemType:string,category_id=0,subcategory_id=0,item_category_id=0,item_subcategory_id=0,slug?:string):SearchResult=>({id,name,type:itemType,search_type:type,category_id,subcategory_id,item_category_id,item_subcategory_id,...(slug?{slug}:{})});
 try{
  let results:SearchResult[]=[];
  if(type==='product'){
   const {weightedFrontMenuKeywords,weightedFrontMenuSearchWords}=await import('@/lib/localBulk128Weighted.mjs');
   const words=[...new Set(weightedFrontMenuSearchWords(q))].slice(0,12);
   if(!words.length)return respond([]);
   const conditions=words.map(()=>"pk.name LIKE ?").join(' OR ');
   const values=words.map(w=>`%${safeLike(w)}%`);
   if(words.length>1){values.push(`%${safeLike(words.join('%'))}%`);}
   const joined=words.length>1?`${conditions} OR pk.name LIKE ?`:conditions;
   const [rows]=await pool.execute<RowDataPacket[]>(`SELECT pk.product_keyword_id AS id,pk.name,pk.item_subcategory_id FROM product_keywords pk WHERE pk.status=1 AND (${joined})
    AND EXISTS (SELECT 1 FROM products pr JOIN users u ON u.user_id=pr.user_id WHERE pr.keyword_id=pk.product_keyword_id AND pr.status=1 AND pr.is_approve=1 AND pr.is_delete=0 AND u.status=1 AND u.is_approve=1 AND u.is_delete=0) LIMIT 1000`,values);
   const ranked=weightedFrontMenuKeywords(q,rows.map(r=>({id:Number(r.id),name:String(r.name),item_subcategory_id:Number(r.item_subcategory_id||0)})),6);
   results=ranked.map(item=>({...make(Number(item.id),String(item.title),'keyword',Number(item.category||0),Number(item.sub_category||0),Number(item.item_category_id||0),Number(item.item_subcategory_id||0)),keyword_id:Number(item.id)}));
  }else{
   const isSeller=type==='seller';
   const [companies]=await pool.execute<RowDataPacket[]>(`SELECT ci.company_id AS id,ci.organization_name AS name,ci.organization_slug AS slug FROM users u INNER JOIN company_info ci ON ci.company_id=u.company_id WHERE u.is_seller=? AND u.status=1 AND u.is_delete=0 ${isSeller?'AND u.is_approve=1':''} AND ci.organization_name LIKE ? LIMIT 3`,[isSeller?1:0,pattern]);
   results=companies.map(c=>make(Number(c.id),String(c.name),type,0,0,0,0,String(c.slug??'')));
   if(isSeller){
    const [categories]=await pool.execute<RowDataPacket[]>(`SELECT c.category_id AS id,c.name FROM seller_categories sc INNER JOIN categories c ON c.category_id=sc.category_id WHERE c.name LIKE ? GROUP BY c.category_id,c.name LIMIT 5`,[pattern]);
    results.push(...categories.map(c=>make(Number(c.id),String(c.name),'category',Number(c.id))));
    const [subcategories]=await pool.execute<RowDataPacket[]>(`SELECT s.sub_category_id AS id,s.name,s.category AS category_id FROM seller_categories sc INNER JOIN sub_categories s ON s.sub_category_id=sc.subcategory_id WHERE s.name LIKE ? GROUP BY s.sub_category_id,s.name,s.category LIMIT 5`,[pattern]);
    results.push(...subcategories.map(s=>make(Number(s.id),String(s.name),'subcategory',Number(s.category_id),Number(s.id))));
   }
   // Original buyer search deliberately returns companies only (category suggestions commented out).
  }
  return respond(results.map(item=>{
   let url:string;
   if(type==='product'){
    const qs=new URLSearchParams();if(item.category_id)qs.set('category_id',String(item.category_id));if(item.subcategory_id)qs.set('subcategory_id',String(item.subcategory_id));if(item.item_category_id)qs.set('item_category_id',String(item.item_category_id));
    url=`/products${qs.size?'?'+qs.toString():''}`;
   }else if(item.type==='seller'||item.type==='buyer')url=`/companies/${item.slug??''}`;
   else{const qs=new URLSearchParams();if(item.category_id)qs.set('category_id',String(item.category_id));if(item.subcategory_id)qs.set('subcategory_id',String(item.subcategory_id));if(item.item_category_id)qs.set('item_category_id',String(item.item_category_id));url=`/company-list${qs.size?'?'+qs.toString():''}`;}
   return {...item,url};
  }));
 }catch{return respond({error:'Front Menu search unavailable.'},503);}
}
