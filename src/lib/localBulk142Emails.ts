/** BULK142: native Emails module, 8 original Express methods.
 * Based on legacy/sourceindia-express/routes/emailsRoutes.js and controllers/emailsController.js.
 * Authorized write parity is deferred. Writes are isolated-QA-only, never live DB.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>respond({error:'Database unavailable'},503);
const notFound=()=>respond({message:'Email not found'},404);
const idNumber=(raw:string)=>/^[1-9]\d{0,14}$/.test(raw)&&Number.isSafeInteger(Number(raw))?Number(raw):null;
const utc=(field:'created_at'|'updated_at')=>`CASE WHEN ${field} IS NULL THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(${field}, INTERVAL TIMESTAMPDIFF(SECOND,NOW(),UTC_TIMESTAMP()) SECOND),'%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${field}`;
const fields=`email_id AS id,uuid,title,email_for,description,subject,is_seller_direct,message,status,${utc('created_at')},${utc('updated_at')}`;
const db=()=>localAccountDatabase();
type EmailRow=RowDataPacket & {id:number;message:Buffer|string|null;status:number};
const asBytes=(v:unknown):Buffer|null=>Buffer.isBuffer(v)?v:typeof v==='string'?Buffer.from(v,'utf8'):v instanceof Uint8Array?Buffer.from(v):null;
const asSequelizeJson=(r:EmailRow)=>({...r,message:asBytes(r.message)?.toJSON()??null});
const asDetail=(r:EmailRow)=>({...r,message:asBytes(r.message)?.toString('utf8')||null});
const asServer=(r:EmailRow)=>({id:r.id,title:r.title,email_for:r.email_for,subject:r.subject,description:r.description,is_seller_direct:r.is_seller_direct,message:asBytes(r.message)?.toString('utf8')||null,status:Number(r.status)===1?'Active':'Inactive',created_at:r.created_at,updated_at:r.updated_at});

export function emailsQaGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_EMAILS_QA_WRITES_ENABLED!=='1')return respond({message:'Email writes disabled.'},403);
 const name=env.DB_NAME??'',host=(env.DB_HOST??'').toLowerCase();
 if(!name||name!==env.SOURCEINDIA_EMAILS_QA_DB_NAME||!/(qa|test|sandbox)/i.test(name)||!['localhost','127.0.0.1','::1'].includes(host))return respond({message:'Isolated QA database required.'},403);
 const secret=env.SOURCEINDIA_EMAILS_QA_TOKEN??'',auth=req.headers.get('authorization')??'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return respond({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return respond({message:'Origin denied.'},403);}catch{return respond({message:'Origin denied.'},403);}}
 return null;
}
const accepted=['title','email_for','subject','description','is_seller_direct','message','status'] as const;
type EmailField=typeof accepted[number];
async function parsePayload(req:NextRequest):Promise<Record<string,unknown>|null>{
 const size=Number(req.headers.get('content-length')??0);if(!Number.isFinite(size)||size>100_000)return null;
 const contentType=req.headers.get('content-type')??'';
 try{
  if(contentType.startsWith('application/json')){const body:unknown=await req.json();return body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:null;}
  if(contentType.startsWith('application/x-www-form-urlencoded')){const raw=await req.text();if(raw.length>100_000)return null;const out:Record<string,unknown>={};for(const [k,v] of new URLSearchParams(raw)){if(Object.hasOwn(out,k))return null;out[k]=v;}return out;}
 }catch{/* invalid payload */}
 return null;
}
function cleanPayload(body:Record<string,unknown>,isCreate:boolean):Record<EmailField,string|number|null>|null{
 const out={} as Record<EmailField,string|number|null>;
 for(const key of accepted){const v=body[key];if(v===undefined)continue;
  if(v===null){if(['title','subject','description','message','is_seller_direct','status'].includes(key))return null;out[key]=null;continue;}
  if(key==='is_seller_direct'||key==='status'){
   if((typeof v!=='number'&&typeof v!=='string')||!/^[01]$/.test(String(v)))return null;
   out[key]=Number(v);continue;
  }
  if(typeof v!=='string'||v.length>(key==='message'?65535:key==='subject'||key==='description'?20000:255))return null;
  if(['title','subject','description','message'].includes(key)&&!v.length)return null;
  out[key]=v;
 }
 if(isCreate&&['title','subject','description','message','is_seller_direct','status'].some(key=>!Object.hasOwn(out,key)))return null;
 return out;
}
async function trans<T>(handler:(conn:PoolConnection)=>Promise<T>){const pool=db();if(!pool)throw Error('NO_DB');const conn=await pool.getConnection();try{await conn.beginTransaction();const result=await handler(conn);await conn.commit();return result;}catch(e){await conn.rollback();throw e;}finally{conn.release();}}
async function locked(conn:PoolConnection,id:number){const [rows]=await conn.execute<EmailRow[]>(`SELECT ${fields} FROM emails WHERE email_id=? LIMIT 1 FOR UPDATE`,[id]);return rows[0]??null;}
async function lookup(id:number){const pool=db();if(!pool)throw Error('NO_DB');const [rows]=await pool.execute<EmailRow[]>(`SELECT ${fields} FROM emails WHERE email_id=? LIMIT 1`,[id]);return rows[0]??null;}

export async function listEmails(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<EmailRow[]>(`SELECT ${fields} FROM emails ORDER BY email_id ASC`);return respond(rows.map(row=>({...asSequelizeJson(row),getStatus:Number(row.status)===1?'Active':'Inactive'})));}catch{return unavailable();}}
export async function emailsCount(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM emails');return respond({total:rows[0]?.total??0});}catch{return unavailable();}}
export async function getEmail(raw:string){const id=idNumber(raw);if(id===null)return notFound();try{const row=await lookup(id);return row?respond(asDetail(row)):notFound();}catch{return unavailable();}}
export async function emailsServerSide(req:NextRequest){
 const pool=db();if(!pool)return unavailable();const q=req.nextUrl.searchParams;
 const page=Number(q.get('page')??1),limit=Number(q.get('limit')??10),search=q.get('search')??'',emailFor=q.get('emailFor')??'';
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>500||search.length>255||emailFor.length>255)return respond({message:'Invalid pagination'},400);
 const requested=q.get('sortBy')??'id',columns=new Set(['id','title','email_for','subject','description','is_seller_direct','message','status','created_at','updated_at']);
 const order=columns.has(requested)?requested==='id'?'email_id':requested:'email_id',direction=['ASC','DESC'].includes(q.get('sort')??'DESC')?(q.get('sort')??'DESC'):'ASC';
 const where:string[]=[],params:(string|number)[]=[];
 if(search){if(search.toLowerCase()==='active'||search.toLowerCase()==='inactive'){where.push('status=?');params.push(search.toLowerCase()==='active'?1:0);}else{where.push('(title LIKE ? OR email_for LIKE ? OR subject LIKE ?)');params.push(...Array(3).fill('%'+search+'%'));}}
 if(emailFor){where.push('email_for LIKE ?');params.push('%'+emailFor+'%');}
 const clause=where.length?' WHERE '+where.join(' AND '):'';
 try{const [[total],[filtered],[rows]]=await Promise.all([
  pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM emails'),
  pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM emails${clause}`,params),
  pool.execute<EmailRow[]>(`SELECT ${fields} FROM emails${clause} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit])
 ]);
 const mapped=rows.map(asServer);
 if(requested==='status')mapped.sort((a,b)=>a.status===b.status?0:a.status==='Active'?(direction==='ASC'?-1:1):(direction==='ASC'?1:-1));
 return respond({data:mapped,totalRecords:total[0]?.total??0,filteredRecords:filtered[0]?.total??0});
 }catch{return unavailable();}
}
export async function createEmail(req:NextRequest){const denied=emailsQaGate(req);if(denied)return denied;const body=await parsePayload(req),input=body&&cleanPayload(body,true);if(!input)return respond({message:'Invalid email payload'},400);
 try{const row=await trans(async conn=>{const keys=Object.keys(input) as EmailField[];const [inserted]=await conn.execute<ResultSetHeader>(`INSERT INTO emails (uuid,${keys.join(',')},created_at,updated_at) VALUES (?,${keys.map(()=>'?').join(',')},NOW(),NOW())`,[randomUUID(),...keys.map(k=>input[k])]);return locked(conn,inserted.insertId);});return respond({message:'Email created',emails:row&&asSequelizeJson(row)},201);}catch{return unavailable();}}
export async function updateEmail(req:NextRequest,raw:string){const denied=emailsQaGate(req);if(denied)return denied;const id=idNumber(raw);if(id===null)return notFound();const body=await parsePayload(req),input=body&&cleanPayload(body,false);if(!input)return respond({message:'Invalid email payload'},400);
 try{return await trans(async conn=>{const before=await locked(conn,id);if(!before)return notFound();const keys=Object.keys(input) as EmailField[];if(keys.length)await conn.execute(`UPDATE emails SET ${keys.map(key=>`${key}=?`).join(',')},updated_at=NOW() WHERE email_id=?`,[...keys.map(k=>input[k]),id]);const after=await locked(conn,id);return respond({message:'Email updated',emails:after&&asSequelizeJson(after)});});}catch{return unavailable();}}
export async function deleteEmail(req:NextRequest,raw:string){const denied=emailsQaGate(req);if(denied)return denied;const id=idNumber(raw);if(id===null)return notFound();try{return await trans(async conn=>{const row=await locked(conn,id);if(!row)return notFound();await conn.execute('DELETE FROM emails WHERE email_id=?',[id]);return respond({message:'Email deleted successfully'});});}catch{return unavailable();}}
export async function cloneEmail(req:NextRequest){const denied=emailsQaGate(req);if(denied)return denied;const body=await parsePayload(req);if(!body?.id)return respond({message:'Email ID required.'},400);const id=idNumber(String(body.id));if(id===null)return respond({message:'Email not found.'},404);
 try{return await trans(async conn=>{const old=await locked(conn,id);if(!old)return respond({message:'Email not found.'},404);
 const title=String(old.title)+' (Clone)';if(title.length>255)return respond({message:'Clone title too long'},400);
 const [result]=await conn.execute<ResultSetHeader>('INSERT INTO emails (uuid,title,email_for,subject,description,is_seller_direct,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())',[randomUUID(),title,old.email_for,old.subject,old.description,old.is_seller_direct,old.message,old.status]);
 return respond({message:'Email cloned successfully.',newId:result.insertId});});}catch{return unavailable();}}
