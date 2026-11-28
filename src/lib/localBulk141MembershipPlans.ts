/** BULK141: Membership Plan complete native module (10 original Express endpoints).
 * Original: legacy/sourceindia-express/routes/membershipPlanRoutes.js and controllers/membershipPlanController.js.
 * All writes are implemented but fail closed on the existing primary database. Authorized write parity is deferred.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const answer=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>answer({error:'Database unavailable'},503);
const notFound=()=>answer({message:'Membership Plan not found'},404);
const validId=(s:string)=>/^[1-9]\d{0,14}$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const utc=(column:'created_at'|'updated_at')=>`CASE WHEN ${column} IS NULL THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(${column}, INTERVAL TIMESTAMPDIFF(SECOND,NOW(),UTC_TIMESTAMP()) SECOND),'%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${column}`;
const cols=`membership_plan_id AS id,uuid,name,sub_title,status,price,free,user,enquiries,category,product,is_default,expire_days,is_delete,elcina_plan,${utc('created_at')},${utc('updated_at')}`;
const serverCols=`membership_plan_id AS id,name,sub_title,price,user,category,product,status,is_delete,${utc('created_at')},${utc('updated_at')}`;
const quoteLike=(s:string)=>s.replace(/[\\%_]/g,'\\$&');
const names=['name','sub_title','price','user','category','product','expire_days','status','is_default','free','elcina_plan','enquiries'] as const;
type Field=typeof names[number];
const numbers=new Set<Field>(['price','user','category','product','expire_days','status','is_default','free','elcina_plan','enquiries']);
const required=new Set<Field>(['name','price','user','category','product','expire_days','enquiries']);

/** Never enable mutation on production or a database that is not explicitly isolated and local. */
export function membershipQaGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_MEMBERSHIP_QA_WRITES_ENABLED!=='1')return answer({message:'Membership plan writes disabled.'},403);
 const database=env.DB_NAME??'',host=(env.DB_HOST??'').toLowerCase();
 if(!database||database!==env.SOURCEINDIA_MEMBERSHIP_QA_DB_NAME||!/(qa|test|sandbox)/i.test(database)||!['127.0.0.1','localhost','::1'].includes(host))return answer({message:'Isolated QA database required.'},403);
 const secret=env.SOURCEINDIA_MEMBERSHIP_QA_TOKEN??'',auth=req.headers.get('authorization')??'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return answer({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return answer({message:'Origin denied.'},403);}catch{return answer({message:'Origin denied.'},403);}}
 return null;
}
async function payload(req:NextRequest):Promise<Record<string,unknown>|null>{
 const size=Number(req.headers.get('content-length')??0);if(!Number.isFinite(size)||size>16000)return null;
 const contentType=req.headers.get('content-type')??'';
 try{
  if(contentType.startsWith('application/json')){const data:unknown=await req.json();return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null;}
  if(contentType.startsWith('application/x-www-form-urlencoded')){const raw=await req.text();if(raw.length>16000)return null;const out:Record<string,unknown>={};for(const [k,v] of new URLSearchParams(raw)){if(Object.hasOwn(out,k))return null;out[k]=v;}return out;}
 }catch{/* malformed request */}
 return null;
}
function normalizeFields(body:Record<string,unknown>,creation:boolean):Record<Field,string|number|null>|null{
 const out={} as Record<Field,string|number|null>;
 for(const key of names){
  const value=body[key];if(value===undefined)continue;
  if(value===null){if(required.has(key))return null;out[key]=null;continue;}
  if(key==='name'||key==='sub_title'){
   if(typeof value!=='string'||value.length>255||key==='name'&&value.trim().length===0)return null;
   out[key]=value;continue;
  }
  if(numbers.has(key)){
   if(typeof value!=='number'&&typeof value!=='string'||String(value).trim()===''||!/^\d+$/.test(String(value)))return null;
   const number=Number(value);if(!Number.isSafeInteger(number)||number>2147483647)return null;
   if((key==='status'||key==='is_default'||key==='free'||key==='elcina_plan')&&number>1)return null;
   out[key]=number;continue;
  }
 }
 if(creation){
  if(!Object.hasOwn(out,'enquiries'))out.enquiries=0;
  if(!Object.hasOwn(out,'expire_days'))out.expire_days=365;
  if(!Object.hasOwn(out,'status'))out.status=1;
  for(const key of required){if(!Object.hasOwn(out,key))return null;}
 }
 return out;
}
const db=()=>localAccountDatabase();
async function transaction<T>(fn:(conn:PoolConnection)=>Promise<T>):Promise<T>{const pool=db();if(!pool)throw Error('NO_DB');const conn=await pool.getConnection();try{await conn.beginTransaction();const output=await fn(conn);await conn.commit();return output;}catch(e){await conn.rollback();throw e;}finally{conn.release();}}
async function getLocked(conn:PoolConnection,id:number){const [rows]=await conn.execute<RowDataPacket[]>(`SELECT ${cols} FROM membership_plans WHERE membership_plan_id=? LIMIT 1 FOR UPDATE`,[id]);return rows[0]??null;}

export async function listMembershipPlans(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<RowDataPacket[]>(`SELECT ${cols} FROM membership_plans ORDER BY membership_plan_id ASC`);return answer(rows.map(r=>({...r,getStatus:Number(r.status)===1?'Active':'Inactive'})));}catch{return unavailable();}}
export async function membershipPlanCount(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM membership_plans WHERE is_delete=0');return answer({total:rows[0]?.total??0});}catch{return unavailable();}}
export async function getMembershipPlan(raw:string){const id=validId(raw);if(id===null)return notFound();const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.execute<RowDataPacket[]>(`SELECT ${cols} FROM membership_plans WHERE membership_plan_id=? LIMIT 1`,[id]);return rows[0]?answer(rows[0]):notFound();}catch{return unavailable();}}

function rangeStart(date:string){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))?date:null;}
export async function membershipPlanServerSide(req:NextRequest){
 const pool=db();if(!pool)return unavailable();
 const q=req.nextUrl.searchParams,page=Number(q.get('page')??1),limit=Number(q.get('limit')??10),search=q.get('search')??'';
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>500||search.length>255)return answer({message:'Invalid pagination'},400);
 const allowed=new Set(['id','name','sub_title','price','user','category','product','created_at','updated_at']);
 const sortBy=q.get('sortBy')??'id',direction=['ASC','DESC'].includes(q.get('sort')??'DESC')?(q.get('sort')??'DESC'):'ASC';
 const order=allowed.has(sortBy)?sortBy==='id'?'membership_plan_id':sortBy:'membership_plan_id';
 const deleted=q.get('getDeleted')==='true'?1:0;
 const predicates=['is_delete=?'],values:(string|number)[]=[deleted];
 if(search){predicates.push("(name LIKE ? OR CAST(price AS CHAR) LIKE ? OR CAST(user AS CHAR) LIKE ? OR CAST(category AS CHAR) LIKE ? OR CAST(product AS CHAR) LIKE ?)");values.push(...Array(5).fill('%'+quoteLike(search)+'%'));}
 const dateRange=(q.get('dateRange')??'').toLowerCase().replace(/\s+/g,'');const now=new Date(),midnight=new Date(now);midnight.setHours(0,0,0,0);
 let from:Date|null=null,to:Date|null=null;
 if(dateRange==='today'){from=midnight;to=now;}
 else if(dateRange==='yesterday'){from=new Date(midnight.getTime()-86400000);to=new Date(midnight.getTime()-1);}
 else if(dateRange==='last7days'||dateRange==='last30days'||/^\d{1,3}$/.test(dateRange)){const days=dateRange==='last7days'?7:dateRange==='last30days'?30:Number(dateRange);if(days>0&&days<=366){from=new Date(midnight.getTime()-(days-1)*86400000);to=now;}}
 else if(dateRange==='thismonth'){from=new Date(now.getFullYear(),now.getMonth(),1);to=now;}
 else if(dateRange==='lastmonth'){from=new Date(now.getFullYear(),now.getMonth()-1,1);to=new Date(new Date(now.getFullYear(),now.getMonth(),1).getTime()-1);}
 else if(dateRange==='customrange'){const start=rangeStart(q.get('startDate')??''),end=rangeStart(q.get('endDate')??'');if(start&&end){from=new Date(start+'T00:00:00');to=new Date(end+'T23:59:59');}}
 if(from&&to){predicates.push('created_at BETWEEN ? AND ?');values.push(from.toISOString().slice(0,19).replace('T',' '),to.toISOString().slice(0,19).replace('T',' '));}
 const where='WHERE '+predicates.join(' AND ');
 try{
  const [[totalRows],[filterRows],[rows]]=await Promise.all([
   pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM membership_plans WHERE is_delete=?',[deleted]),
   pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM membership_plans ${where}`,values),
   pool.execute<RowDataPacket[]>(`SELECT ${serverCols} FROM membership_plans ${where} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...values,limit,(page-1)*limit])
  ]);
  return answer({data:rows,totalRecords:totalRows[0]?.total??0,filteredRecords:filterRows[0]?.total??0});
 }catch{return unavailable();}
}
export async function createMembershipPlan(req:NextRequest){
 const denied=membershipQaGate(req);if(denied)return denied;
 const data=await payload(req),fields=data&&normalizeFields(data,true);if(!fields)return answer({message:'Invalid membership plan'},400);
 try{const member=await transaction(async conn=>{
  const keys=Object.keys(fields) as Field[];const [result]=await conn.execute<ResultSetHeader>(`INSERT INTO membership_plans (uuid,${keys.join(',')},is_delete,created_at,updated_at) VALUES (?,${keys.map(()=>'?').join(',')},0,NOW(),NOW())`,[randomUUID(),...keys.map(k=>fields[k]),]);
  return getLocked(conn,result.insertId);
 });return answer({message:'Membership Plan created',membershipPlan:member},201);}catch{return unavailable();}
}
export async function updateMembershipPlan(req:NextRequest,raw:string){
 const denied=membershipQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();const data=await payload(req),fields=data&&normalizeFields(data,false);if(!fields)return answer({message:'Invalid membership plan'},400);
 try{return await transaction(async conn=>{const row=await getLocked(conn,id);if(!row)return notFound();const keys=Object.keys(fields) as Field[];
  if(keys.length)await conn.execute(`UPDATE membership_plans SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=NOW() WHERE membership_plan_id=?`,[...keys.map(k=>fields[k]),id]);
  return answer({message:'Membership Plan updated',membershipPlan:await getLocked(conn,id)});
 });}catch{return unavailable();}
}
export async function deleteMembershipPlan(req:NextRequest,raw:string){
 const denied=membershipQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();
 try{return await transaction(async conn=>{const existing=await getLocked(conn,id);if(!existing)return notFound();await conn.execute('DELETE FROM membership_plans WHERE membership_plan_id=?',[id]);return answer({message:'Membership Plan deleted successfully'});});}catch{return unavailable();}
}
export async function deleteSelectedMembershipPlans(req:NextRequest){
 const denied=membershipQaGate(req);if(denied)return denied;const body=await payload(req),ids=body?.ids;
 if(!Array.isArray(ids)||!ids.length)return answer({message:'Please provide an array of IDs to delete.'},400);
 if(ids.length>500)return answer({message:'Invalid IDs'},400);
 const parsed=ids.map(v=>validId(String(v)));if(parsed.some(v=>v===null))return answer({message:'Invalid IDs'},400);
 const unique=[...new Set(parsed)] as number[];
 try{return await transaction(async conn=>{const slots=unique.map(()=>'?').join(',');const [rows]=await conn.execute<RowDataPacket[]>(`SELECT membership_plan_id FROM membership_plans WHERE membership_plan_id IN (${slots}) FOR UPDATE`,unique);if(!rows.length)return answer({message:'No membership plan found with the given IDs.'},404);await conn.execute(`DELETE FROM membership_plans WHERE membership_plan_id IN (${slots})`,unique);return answer({message:`${rows.length} membership plan deleted successfully.`});});}catch{return unavailable();}
}
export async function membershipPlanToggle(req:NextRequest,raw:string,field:'status'|'is_delete'){
 const denied=membershipQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();const body=await payload(req),value=body?.[field];
 if(value!==0&&value!==1)return answer({message:field==='status'?'Invalid status. Use 1 (Active) or 0 (Deactive).':'Invalid delete status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await transaction(async conn=>{const existing=await getLocked(conn,id);if(!existing)return notFound();await conn.execute(`UPDATE membership_plans SET ${field}=?,updated_at=NOW() WHERE membership_plan_id=?`,[value,id]);return answer({message:field==='status'?'Status updated':'Membership Plan is removed',membershipPlan:await getLocked(conn,id)});});}catch{return unavailable();}
}
