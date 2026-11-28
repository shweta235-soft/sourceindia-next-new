/** BULK135: legacy /v2/api/shortcut/shortcut_menus native endpoints.
 * Original source: legacy/sourceindia-express/controllers/shortcutController.js.
 * Mutations are disabled unless a disposable LOCAL QA database and token are configured.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,PoolConnection,ResultSetHeader} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>respond({message:'Server Error'},503);
const notFound=()=>respond({message:'Shortcut not found'},404);
// The original Sequelize connection serializes dates in UTC. The local mysql2
// pool can inherit a non-UTC MySQL session timezone. Calculate the session
// offset on each query instead of hardcoding a +05:30 correction; this keeps
// read responses aligned when the database timezone changes.
const utcDate = (field: 'created_at' | 'updated_at') =>
 `CASE WHEN ${field} IS NULL OR YEAR(${field})=0 OR MONTH(${field})=0 OR DAYOFMONTH(${field})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(${field}, INTERVAL TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) SECOND), '%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${field}`;
const select=`shortcut_id AS id,uuid,name,link,is_delete,status,${utcDate('created_at')},${utcDate('updated_at')}`;
const validId=(s:string)=>/^[1-9]\d{0,14}$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const like=(s:string)=>s.replace(/[\\%_]/g,x=>'\\'+x);

export function shortcutWriteGate(req:NextRequest,e:NodeJS.ProcessEnv=process.env):Response|null{
 if(e.NODE_ENV==='production'||e.SOURCEINDIA_SHORTCUT_QA_WRITES_ENABLED!=='1')return respond({message:'Shortcut writes disabled.'},403);
 const host=(e.DB_HOST??'').toLowerCase(),database=e.DB_NAME??'';
 if(!['127.0.0.1','localhost','::1'].includes(host)||!database||database!==e.SOURCEINDIA_SHORTCUT_QA_DB_NAME||!/(qa|test|sandbox)/i.test(database))return respond({message:'Isolated QA database required.'},403);
 const secret=e.SOURCEINDIA_SHORTCUT_QA_TOKEN??'',auth=req.headers.get('authorization')??'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return respond({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return respond({message:'Origin denied.'},403);}catch{return respond({message:'Origin denied.'},403);}}
 return null;
}
async function parseBody(req:NextRequest):Promise<Record<string,unknown>|null>{
 const size=Number(req.headers.get('content-length')??0);if(!Number.isFinite(size)||size>16000)return null;
 const type=req.headers.get('content-type')??'';
 try{
  if(type.startsWith('application/json')){const x:unknown=await req.json();return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;}
  if(type.startsWith('application/x-www-form-urlencoded')){const raw=await req.text();if(raw.length>16000)return null;const out:Record<string,unknown>={};for(const [k,v] of new URLSearchParams(raw)){if(Object.hasOwn(out,k))return null;out[k]=v;}return out;}
 }catch{/* malformed */}
 return null;
}
const shortcutFields=(v:Record<string,unknown>|null,previous?:Record<string,unknown>)=>{
 if(!v)return null;
 const x={...previous,...v};
 if(typeof x.name!=='string'||!x.name||x.name.length>255||typeof x.link!=='string'||!x.link||x.link.length>255)return null;
 let status:unknown=x.status;
 if(status===undefined||status===null)status=1;
 if(typeof status==='string'&&/^-?\d+$/.test(status))status=Number(status);
 if(typeof status!=='number'||!Number.isInteger(status)||status<0||status>255)return null;
 return {name:x.name,link:x.link,status};
};
async function transact<T>(run:(c:PoolConnection)=>Promise<T>):Promise<T>{const db=localAccountDatabase();if(!db)throw Error('NO_DB');const c=await db.getConnection();try{await c.beginTransaction();const result=await run(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
async function locked(c:PoolConnection,id:number){const [rows]=await c.execute<RowDataPacket[]>(`SELECT ${select} FROM shortcut_menus WHERE shortcut_id=? LIMIT 1 FOR UPDATE`,[id]);return rows[0]??null;}

export async function listShortcuts(req:NextRequest):Promise<Response>{
 const pool=localAccountDatabase();if(!pool)return unavailable();
 const params=req.nextUrl.searchParams,search=params.get('search')??'',status=params.get('status')??'';
 if(search.length>255)return respond({message:'Server Error'},400);
 // Express parseInt(status) is used by original handler; an invalid status filters out all rows.
 const parsed=status===''?null:parseInt(status,10);
 const extra=status===''?'': ' AND status = ?';
 try{const [rows]=await pool.execute<RowDataPacket[]>(`SELECT ${select} FROM shortcut_menus WHERE is_delete=0 AND (name LIKE ? OR link LIKE ?)${extra} ORDER BY shortcut_id ASC`,[...Array(2).fill('%'+like(search)+'%'),...(status===''?[]:[Number.isNaN(parsed)?null:parsed])]);return respond(rows);}catch{return unavailable();}
}
export async function createShortcut(req:NextRequest):Promise<Response>{
 const denied=shortcutWriteGate(req);if(denied)return denied;
 const data=await parseBody(req);
 if(!data?.name||!data?.link)return respond({message:'Name and Link are required'},400);
 const fields=shortcutFields(data);if(!fields)return respond({message:'Server Error'},400);
 try{const item=await transact(async c=>{const [r]=await c.execute<ResultSetHeader>('INSERT INTO shortcut_menus (uuid,name,link,status,is_delete,created_at,updated_at) VALUES (?,?,?,?,0,NOW(),NOW())',[randomUUID(),fields.name,fields.link,fields.status]);return locked(c,r.insertId);});return respond({message:'Shortcut added successfully',data:item},201);}catch{return unavailable();}
}
export async function updateShortcut(req:NextRequest,raw:string):Promise<Response>{
 const denied=shortcutWriteGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();
 const payload=await parseBody(req);if(!payload)return respond({message:'Server Error'},400);
 try{return await transact(async c=>{const previous=await locked(c,id);if(!previous)return notFound();const fields=shortcutFields(payload,previous);if(!fields)return respond({message:'Server Error'},400);
 await c.execute('UPDATE shortcut_menus SET name=?,link=?,status=?,updated_at=NOW() WHERE shortcut_id=?',[fields.name,fields.link,fields.status,id]);return respond({message:'Shortcut updated successfully',data:await locked(c,id)});
 });}catch{return unavailable();}
}
export async function deleteShortcut(req:NextRequest,raw:string):Promise<Response>{
 const denied=shortcutWriteGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();
 try{return await transact(async c=>{const previous=await locked(c,id);if(!previous||Number(previous.is_delete)===1)return notFound();await c.execute('UPDATE shortcut_menus SET is_delete=1,updated_at=NOW() WHERE shortcut_id=?',[id]);return respond({message:'Shortcut deleted successfully'});});}catch{return unavailable();}
}
