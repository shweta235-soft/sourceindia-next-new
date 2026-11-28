/** BULK138: Native Home Banner read endpoints and guarded QA-only status/deletion.
 * Source: legacy/sourceindia-express/controllers/homeBannerController.js.
 * Image-create/update/delete parity is not enabled against the original database.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {createQaBanner,updateQaBanner,deleteQaBanner} from '@/lib/localBulk139BannerWrites';

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const failure=()=>json({error:'Local database unavailable'},503);
const missing=()=>json({message:'Home Banners not found'},404);
const validId=(v:string)=>/^[1-9]\d{0,14}$/.test(v)&&Number.isSafeInteger(Number(v))?Number(v):null;
const dateSql=(name:'created_at'|'updated_at')=>`CASE WHEN b.${name} IS NULL THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(b.${name}, INTERVAL TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) SECOND), '%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${name}`;
const select=`b.home_banner_id AS id,b.uuid,b.title,b.sub_title,b.description,b.button_text,b.button_url,b.file_id,b.status,b.is_delete,${dateSql('created_at')},${dateSql('updated_at')},i.file AS file_name`;
const join='FROM home_banners b LEFT JOIN upload_images i ON i.upload_image_id=b.file_id';
const pool=()=>localAccountDatabase();
const percent=(s:string)=>s.replace(/[\\%_]/g,'\\$&');
function rowPublic(row:RowDataPacket){const {file_name,...rest}=row;return {...rest,file_name:file_name??null};}

export function bannerQaGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_BANNERS_QA_WRITES_ENABLED!=='1')return json({message:'Home banner writes disabled.'},403);
 const db=env.DB_NAME??'',host=(env.DB_HOST??'').toLowerCase();
 if(!db||db!==env.SOURCEINDIA_BANNERS_QA_DB_NAME||!/(qa|test|sandbox)/i.test(db)||!['localhost','127.0.0.1','::1'].includes(host))return json({message:'Isolated QA database required.'},403);
 const secret=env.SOURCEINDIA_BANNERS_QA_TOKEN??'',header=req.headers.get('authorization')??'',token=header.startsWith('Bearer ')?header.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return json({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return json({message:'Origin denied.'},403);}catch{return json({message:'Origin denied.'},403);}}
 return null;
}
async function requestData(req:NextRequest){
 const length=Number(req.headers.get('content-length')??0);if(!Number.isFinite(length)||length>32_768)return null;
 const type=req.headers.get('content-type')??'';
 try{
  if(type.startsWith('application/json')){const v:unknown=await req.json();return v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;}
  if(type.startsWith('application/x-www-form-urlencoded')){const text=await req.text();if(text.length>32_768)return null;const out:Record<string,unknown>={};for(const [k,v] of new URLSearchParams(text)){if(Object.hasOwn(out,k))return null;out[k]=v;}return out;}
 }catch{/* invalid body */}
 return null;
}
async function transact<T>(handler:(conn:PoolConnection)=>Promise<T>){const p=pool();if(!p)throw Error('NO_DB');const c=await p.getConnection();try{await c.beginTransaction();const output=await handler(c);await c.commit();return output;}catch(err){await c.rollback();throw err;}finally{c.release();}}
async function byId(conn:PoolConnection,id:number){const [rows]=await conn.execute<RowDataPacket[]>(`SELECT ${select} ${join} WHERE b.home_banner_id=? LIMIT 1`,[id]);return rows[0]??null;}

export async function listBanners(){const p=pool();if(!p)return failure();try{const [rows]=await p.query<RowDataPacket[]>(`SELECT ${select} ${join} ORDER BY b.home_banner_id ASC`);return json(rows.map(r=>({...rowPublic(r),getStatus:Number(r.status)===1?'Active':'Inactive'})));}catch{return failure();}}
export async function bannerCount(){const p=pool();if(!p)return failure();try{const [rows]=await p.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM home_banners WHERE is_delete=0');return json({total:rows[0]?.total??0});}catch{return failure();}}
export async function getBanner(raw:string){const id=validId(raw);if(id===null)return missing();const p=pool();if(!p)return failure();try{const [rows]=await p.execute<RowDataPacket[]>(`SELECT ${select} ${join} WHERE b.home_banner_id=? LIMIT 1`,[id]);return rows[0]?json({...rowPublic(rows[0]),UploadImage:rows[0].file_name?{file:rows[0].file_name}:null}):json({message:'Home Banner not found'},404);}catch{return failure();}}
function dateStart(input:string){const d=new Date(input+'T00:00:00');return Number.isNaN(+d)?null:d.toISOString().slice(0,10)+' 00:00:00';}
export async function bannerServerSide(req:NextRequest){
 const p=pool();if(!p)return failure();
 const q=req.nextUrl.searchParams,page=parseInt(q.get('page')??'1',10),limit=parseInt(q.get('limit')??'10',10),search=q.get('search')??'';
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>500||search.length>255)return json({message:'Invalid pagination or search'},400);
 const orderColumns=new Set(['id','title','sub_title','description','button_text','button_url','created_at','updated_at']);const requested=q.get('sortBy')??'id';
 const order=orderColumns.has(requested)?(requested==='id'?'b.home_banner_id':`b.${requested}`):'b.home_banner_id';
 const direction=(q.get('sort')??'DESC')==='DESC'?'DESC':'ASC';
 const deleted=q.get('getDeleted')==='true'?1:0;
 const conditions=['b.is_delete=?'];const args:(string|number)[]=[deleted];
 if(search){conditions.push("(b.title LIKE ? ESCAPE '\\\\' OR b.button_text LIKE ? ESCAPE '\\\\')");args.push('%'+percent(search)+'%','%'+percent(search)+'%');}
 const range=(q.get('dateRange')??'').toLowerCase().replace(/\s+/g,'');const now=new Date();const start=new Date(now);start.setHours(0,0,0,0);
 let from:Date|null=null,to:Date|null=null;
 if(range==='today'){from=start;to=now;}else if(range==='yesterday'){from=new Date(start.getTime()-86_400_000);to=new Date(start.getTime()-1);}
 else if(range==='last7days'||range==='last30days'||/^\d{1,3}$/.test(range)){const days=range==='last7days'?7:range==='last30days'?30:Number(range);if(days>=1&&days<=366){from=new Date(start.getTime()-(days-1)*86_400_000);to=now;}}
 else if(range==='thismonth'){from=new Date(now.getFullYear(),now.getMonth(),1);to=now;}
 else if(range==='lastmonth'){from=new Date(now.getFullYear(),now.getMonth()-1,1);to=new Date(new Date(now.getFullYear(),now.getMonth(),1).getTime()-1);}
 else if(range==='customrange'){const begin=q.get('startDate')??'',end=q.get('endDate')??'';if(/^\d{4}-\d\d-\d\d$/.test(begin)&&/^\d{4}-\d\d-\d\d$/.test(end)&&dateStart(begin)&&dateStart(end)){from=new Date(begin+'T00:00:00');to=new Date(end+'T23:59:59');}}
 if(from&&to){const fmt=(x:Date)=>x.toISOString().slice(0,19).replace('T',' ');conditions.push('b.created_at BETWEEN ? AND ?');args.push(fmt(from),fmt(to));}
 const clause='WHERE '+conditions.join(' AND ');
 try{
  const [[totals],[filtered],[rows]]=await Promise.all([
   p.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM home_banners WHERE is_delete=?',[deleted]),
   p.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM home_banners b ${clause}`,args),
   p.execute<RowDataPacket[]>(`SELECT ${select} ${join} ${clause} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...args,limit,(page-1)*limit])
  ]);
  return json({data:rows.map(r=>{const fields:Record<string,unknown>={...rowPublic(r)};delete fields.uuid;return fields;}),totalRecords:totals[0]?.total??0,filteredRecords:filtered[0]?.total??0});
 }catch{return failure();}
}
export async function bannerPost(req:NextRequest){const denied=bannerQaGate(req);if(denied)return denied;return createQaBanner(req);}
export async function bannerPut(req:NextRequest,id:string){const denied=bannerQaGate(req);if(denied)return denied;return updateQaBanner(req,id);}
export async function bannerDelete(req:NextRequest,id:string){const denied=bannerQaGate(req);if(denied)return denied;return deleteQaBanner(req,id);}
export async function bannerDeleteSelected(req:NextRequest){
 const denied=bannerQaGate(req);if(denied)return denied;const body=await requestData(req),ids=body?.ids;
 if(!Array.isArray(ids)||!ids.length||ids.length>500)return json({message:'Please provide an array of IDs to update.'},400);
 const unique=[...new Set(ids.map(v=>validId(String(v))))];if(unique.some(v=>v===null))return json({message:'Invalid banner ID'},400);
 try{return await transact(async c=>{const placeholders=unique.map(()=>'?').join(',');const [rows]=await c.execute<RowDataPacket[]>(`SELECT home_banner_id FROM home_banners WHERE home_banner_id IN (${placeholders}) AND is_delete=0 FOR UPDATE`,unique);if(!rows.length)return json({message:'No Home Banner found with the given IDs.'},404);await c.execute(`UPDATE home_banners SET is_delete=1,updated_at=NOW() WHERE home_banner_id IN (${placeholders})`,unique);return json({message:`${rows.length} Home Banner marked as deleted.`});});}catch{return failure();}
}
export async function bannerToggle(req:NextRequest,raw:string,field:'status'|'is_delete'){
 const denied=bannerQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return missing();const body=await requestData(req);const value=body?.[field];
 if(value!==0&&value!==1)return json({message:field==='status'?'Invalid status. Use 1 (Active) or 0 (Deactive).':'Invalid delete status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await transact(async c=>{const [before]=await c.execute<RowDataPacket[]>('SELECT home_banner_id FROM home_banners WHERE home_banner_id=? FOR UPDATE',[id]);if(!before.length)return missing();await c.execute<ResultSetHeader>(`UPDATE home_banners SET ${field}=?,updated_at=NOW() WHERE home_banner_id=?`,[value,id]);const row=await byId(c,id);return json({message:field==='status'?'Status updated':'Home Banners is removed',homeBanners:row?rowPublic(row):null});});}catch{return failure();}
}
