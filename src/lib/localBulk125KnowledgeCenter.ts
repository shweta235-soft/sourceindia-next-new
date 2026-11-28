/** BULK125: Knowledge Center native handlers. Original Express controller copied nowhere.
 * GET paths are read-only. Mutations are disabled on production and require an
 * isolated local QA database and explicit secret. File-bearing write paths are
 * intentionally not enabled until multipart/filesystem/email parity is proved.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers});
const invalid=()=>reply({message:'Invalid request.'},400);
const unavailable=()=>reply({message:'Knowledge Center unavailable.'},503);
const positive=(s:string)=>/^[1-9]\d{0,14}$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const fields='k.knowledge_center_id AS id,k.uuid,k.name,k.file_id,k.video_url,k.status,k.is_delete,k.created_at,k.updated_at';
const sortCols:Record<string,string>={id:'k.knowledge_center_id',name:'k.name',video_url:'k.video_url',created_at:'k.created_at',updated_at:'k.updated_at'};
const escapeLike=(v:string)=>v.replace(/[\\%_]/g,c=>'\\'+c);
// Local driver serializes DATE as UTC; Express Sequelize dates use ISO UTC on JSON.
const shape=(r:RowDataPacket)=>r;
export async function listKnowledge():Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fields} FROM knowledge_centers k ORDER BY k.knowledge_center_id ASC`);
 return reply(rows.map(r=>({...shape(r),getStatus:Number(r.status)===1?'Active':'Inactive'})));}catch{return unavailable();}
}
export async function countKnowledge():Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{const [rows]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM knowledge_centers WHERE is_delete=0');return reply({total:Number(rows[0]?.total??0)});}catch{return unavailable();}
}
export async function detailKnowledge(idRaw:string):Promise<Response>{
 const id=positive(idRaw);if(!id)return invalid();const db=localAccountDatabase();if(!db)return unavailable();
 try{const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fields},u.file AS file_name FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id=k.file_id WHERE k.knowledge_center_id=? LIMIT 1`,[id]);
 if(!rows[0])return reply({message:'Knowledge Center not found'},404);
 // Express includes UploadImage (nested association) and file_name (alias).
 const r=rows[0];const {file_name,...rest}=r;return reply({...rest,UploadImage:file_name===null?null:{file:file_name},file_name});
 }catch{return unavailable();}
}
export async function gridKnowledge(req:NextRequest):Promise<Response>{
 const p=new URL(req.url).searchParams;
 const pageStr=p.get('page')??'1',limitStr=p.get('limit')??'10';
 if(!/^[1-9]\d{0,5}$/.test(pageStr)||!/^[1-9]\d{0,3}$/.test(limitStr))return invalid();
 const page=Number(pageStr),limit=Number(limitStr),offset=(page-1)*limit;
 if(limit>200||!Number.isSafeInteger(offset))return invalid();
 const search=p.get('search')??'';if(search.length>160)return invalid();
 const sortBy=p.get('sortBy')??'id',sortRaw=p.get('sort')??'DESC';
 const sort=sortCols[sortBy]??sortCols.id;const dir=['ASC','DESC'].includes(sortRaw)?sortRaw:'ASC';
 const deleted=p.get('getDeleted')==='true'?1:0;
 const where=`k.is_delete=?${search?' AND k.name LIKE ?':''}`;
 const args:unknown[]=[deleted,...(search?[`%${escapeLike(search)}%`]:[])];
 const db=localAccountDatabase();if(!db)return unavailable();
 try{const [tot]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM knowledge_centers WHERE is_delete=?',[deleted]);
 const [cnt]=search?await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM knowledge_centers k WHERE ${where}`,args):[tot];
 const [rows]=await db.query<RowDataPacket[]>(`SELECT ${fields},u.file AS _upload_file FROM knowledge_centers k LEFT JOIN upload_images u ON u.upload_image_id=k.file_id WHERE ${where} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`,[...args,limit,offset]);
 return reply({data:rows.map(r=>({id:r.id,name:r.name,video_url:r.video_url,file_id:r.file_id,file_name:r._upload_file??null,status:r.status,is_delete:r.is_delete,created_at:r.created_at,updated_at:r.updated_at})),totalRecords:Number(tot[0]?.total??0),filteredRecords:Number(cnt[0]?.total??0)});
 }catch{return unavailable();}
}
/** Gate denies every mutation on live/production database, including any request
 * with a file. No QA test should make destructive changes to a real database. */
export function writeGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_KNOWLEDGE_WRITES_ENABLED!=='1')return reply({message:'Knowledge Center writes disabled.'},403);
 if(!['localhost','127.0.0.1','::1'].includes((env.DB_HOST??'').toLowerCase()))return reply({message:'Isolated QA database required.'},403);
 const db=env.DB_NAME??'';
 if(!db||db!==env.SOURCEINDIA_KNOWLEDGE_QA_DB_NAME||!/(test|qa|sandbox)/i.test(db))return reply({message:'Isolated QA database required.'},403);
 const key=env.SOURCEINDIA_KNOWLEDGE_QA_TOKEN??'';
 const auth=req.headers.get('authorization')??'';const provided=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(key.length<32||Buffer.byteLength(key)!==Buffer.byteLength(provided)||!timingSafeEqual(Buffer.from(key),Buffer.from(provided)))return reply({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return reply({message:'Origin denied.'},403);}catch{return reply({message:'Origin denied.'},403);}}
 return null;
}
const unsupported=()=>reply({message:'Attachment side-effect parity pending; operation disabled.'},501);
async function body(req:NextRequest):Promise<Record<string,unknown>|null>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 if(Number(req.headers.get('content-length')??'0')>16000)return null;
 try{const data:unknown=await req.json();return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null;}catch{return null;}
}
const statusValue=(v:unknown)=>v===0||v===1?v:null;
async function tx<T>(f:(c:PoolConnection)=>Promise<T>):Promise<T>{
 const db=localAccountDatabase();if(!db)throw Error('DB_UNAVAILABLE');const conn=await db.getConnection();
 try{await conn.beginTransaction();const value=await f(conn);await conn.commit();return value;}catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
const rowForUpdate=async(c:PoolConnection,id:number)=>{
 const [rows]=await c.execute<RowDataPacket[]>(`SELECT ${fields} FROM knowledge_centers k WHERE k.knowledge_center_id=? FOR UPDATE`,[id]);return rows[0]??null;
};
export async function createKnowledge(req:NextRequest):Promise<Response>{
 const denied=writeGate(req);if(denied)return denied;
 // Original route permits multipart uploads; only file-free JSON is supported.
 const data=await body(req);if(!data)return unsupported();
 if(typeof data.name!=='string'||!data.name.trim()||typeof data.video_url!=='string'||statusValue(data.status)===null)return invalid();
 if(data.name.length>255||data.video_url.length>5000||'file' in data)return invalid();
 try{const result=await tx(async c=>{const [out]=await c.execute<ResultSetHeader>(`INSERT INTO knowledge_centers (uuid,name,video_url,status,file_id,is_delete,created_at,updated_at) VALUES (UUID(),?,?,?,0,0,NOW(),NOW())`,[data.name,data.video_url,data.status]);return rowForUpdate(c,out.insertId);});return reply({message:'Knowledge Center created',knowledgeCenter:result},201);}catch{return unavailable();}
}
export async function updateKnowledge(req:NextRequest,idRaw:string):Promise<Response>{
 const denied=writeGate(req);if(denied)return denied;const id=positive(idRaw);if(!id)return invalid();
 const data=await body(req);if(!data)return unsupported();
 if(typeof data.name!=='string'||typeof data.video_url!=='string'||statusValue(data.status)===null||'file' in data||data.name.length>255||data.video_url.length>5000)return invalid();
 try{return await tx(async c=>{const row=await rowForUpdate(c,id);if(!row)return reply({message:'Knowledge Center not found'},404);
 await c.execute('UPDATE knowledge_centers SET name=?,video_url=?,status=?,updated_at=NOW() WHERE knowledge_center_id=?',[data.name,data.video_url,data.status,id]);
 return reply({message:'Knowledge Center updated',knowledgeCenter:await rowForUpdate(c,id)});});}catch{return unavailable();}
}
export async function statusKnowledge(req:NextRequest,idRaw:string,key:'status'|'is_delete'):Promise<Response>{
 const denied=writeGate(req);if(denied)return denied;const id=positive(idRaw);if(!id)return invalid();
 const data=await body(req);const val=statusValue(data?.[key]);
 if(val===null)return reply({message:key==='status'?'Invalid status. Use 1 (Active) or 0 (Deactive).':'Invalid delete status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await tx(async c=>{if(!await rowForUpdate(c,id))return reply({message:'Knowledge Center not found'},404);
 await c.execute(`UPDATE knowledge_centers SET ${key}=?,updated_at=NOW() WHERE knowledge_center_id=?`,[val,id]);
 return reply({message:key==='status'?'Status updated':'Knowledge Center is removed',knowledgeCenter:await rowForUpdate(c,id)});});}catch{return unavailable();}
}
export async function bulkDeleteKnowledge(req:NextRequest):Promise<Response>{
 const denied=writeGate(req);if(denied)return denied;const data=await body(req),ids=data?.ids;
 if(!Array.isArray(ids)||ids.length===0||ids.length>200)return reply({message:'Please provide an array of IDs to update.'},400);
 const numbers=ids.map(v=>positive(String(v)));if(numbers.some(v=>v===null)||new Set(numbers).size!==numbers.length)return invalid();
 try{return await tx(async c=>{const marks=numbers.map(()=>'?').join(',');const [rows]=await c.query<RowDataPacket[]>(`SELECT knowledge_center_id FROM knowledge_centers WHERE knowledge_center_id IN (${marks}) AND is_delete=0 FOR UPDATE`,numbers);
 if(!rows.length)return reply({message:'No knowledge center found with the given IDs.'},404);
 await c.query(`UPDATE knowledge_centers SET is_delete=1,updated_at=NOW() WHERE knowledge_center_id IN (${marks})`,numbers);
 return reply({message:`${rows.length} knowledge center marked as deleted.`});});}catch{return unavailable();}
}
export async function deleteKnowledge(req:NextRequest,idRaw:string):Promise<Response>{
 const denied=writeGate(req);if(denied)return denied;const id=positive(idRaw);if(!id)return invalid();
 // Destructive delete must remove related filesystem image + UploadImage row.
 // Explicitly block until disk cleanup can be verified transactionally.
 return unsupported();
}
