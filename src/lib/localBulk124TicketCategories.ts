/** BULK124 — native Ticket Categories APIs; no original Express controller imports.
 * Legacy source: routes/ticketCategoryRoutes.js, controllers/ticketCategoryController.js,
 * models/TicketCategory.js. Writes are gated to an explicit isolated QA database.
 * GET parity requires same-DB Express-vs-Next comparison, not just source tests.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {randomUUID, timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
const bad=()=>reply({message:'Invalid request.'},400);
const positive=(value:string)=>/^[1-9]\d{0,14}$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):null;
const rowSql='ticket_category_id AS id,uuid,name,email,status,created_at,updated_at';
const validSort:Record<string,string>={id:'ticket_category_id',name:'name',email:'email',created_at:'created_at',updated_at:'updated_at'};
const safeLike=(value:string)=>value.replace(/[\\%_]/g,x=>'\\'+x);

export async function getCategories():Promise<Response>{
 const db=localAccountDatabase();if(!db)return reply({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${rowSql} FROM ticket_categories ORDER BY ticket_category_id ASC`);
  return reply(rows.map(r=>({...r,getStatus:Number(r.status)===1?'Active':'Inactive'})));
 }catch{return reply({message:'Categories unavailable.'},503);}
}
export async function getCategoryCount():Promise<Response>{
 const db=localAccountDatabase();if(!db)return reply({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM ticket_categories');return reply({total:Number(rows[0]?.total??0)});}
 catch{return reply({message:'Categories unavailable.'},503);}
}
export async function getCategoryDetail(raw:string):Promise<Response>{
 const id=positive(raw);if(!id)return bad();
 const db=localAccountDatabase();if(!db)return reply({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${rowSql} FROM ticket_categories WHERE ticket_category_id=? LIMIT 1`,[id]);
  return rows[0]?reply(rows[0]):reply({message:'Ticket Category not found'},404);
 }catch{return reply({message:'Categories unavailable.'},503);}
}
export async function getCategoryGrid(req:NextRequest):Promise<Response>{
 const p=new URL(req.url).searchParams;
 const pageRaw=p.get('page')??'1',limitRaw=p.get('limit')??'10';
 if(!/^[1-9]\d{0,5}$/.test(pageRaw)||!/^[1-9]\d{0,3}$/.test(limitRaw))return bad();
 const page=Number(pageRaw),limit=Number(limitRaw);
 if(limit>200||!Number.isSafeInteger((page-1)*limit))return bad();
 const search=p.get('search')??'';if(search.length>160)return bad();
 const sortBy=p.get('sortBy')??'id';const sortDir=p.get('sort')??'DESC';
 const sort=Object.hasOwn(validSort,sortBy)?validSort[sortBy]:'ticket_category_id';
 const direction=sortDir==='ASC'||sortDir==='DESC'?sortDir:'ASC';
 const where=search?' WHERE name LIKE ? OR email LIKE ?':'';
 const args=search?[`%${safeLike(search)}%`,`%${safeLike(search)}%`]:[];
 const db=localAccountDatabase();if(!db)return reply({message:'Local database unavailable.'},503);
 try{
  const [tot]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM ticket_categories');
  const [cnt]=search?await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ticket_categories${where}`,args):[tot];
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT id,name,email,status,created_at,updated_at FROM (SELECT ticket_category_id AS id,name,email,status,created_at,updated_at FROM ticket_categories) tc ${search?'WHERE name LIKE ? OR email LIKE ?':''} ORDER BY ${sort==='ticket_category_id'?'id':sort} ${direction} LIMIT ? OFFSET ?`,[...args,limit,(page-1)*limit]);
  return reply({data:rows,totalRecords:Number(tot[0]?.total??0),filteredRecords:Number(cnt[0]?.total??0)});
 }catch{return reply({message:'Categories unavailable.'},503);}
}

/** No admin session cookie can reach /v2/api (cookie path /admin). Require a
 * dedicated QA token for writes on legacy paths. Never enable in production. */
export function categoryWriteGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production')return reply({message:'Ticket category writes disabled.'},403);
 if(env.SOURCEINDIA_TICKET_CATEGORY_WRITES_ENABLED!=='1')return reply({message:'Ticket category writes disabled.'},403);
 if(!['localhost','127.0.0.1','::1'].includes((env.DB_HOST??'').toLowerCase()))return reply({message:'Isolated QA database required.'},403);
 const db=env.DB_NAME??'';
 if(!db||db!==env.SOURCEINDIA_TICKET_CATEGORY_QA_DB_NAME||!/(qa|sandbox|test)/i.test(db))return reply({message:'Isolated QA database required.'},403);
 const key=env.SOURCEINDIA_TICKET_CATEGORY_QA_TOKEN??'';
 const authorization=req.headers.get('authorization')??'';
 const provided=authorization.startsWith('Bearer ')?authorization.slice(7):'';
 if(key.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(key)||!timingSafeEqual(Buffer.from(key),Buffer.from(provided)))return reply({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return reply({message:'Origin not allowed.'},403);}catch{return reply({message:'Origin not allowed.'},403);}}
 return null;
}
async function jsonBody(req:NextRequest):Promise<Record<string,unknown>|null>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 const length=Number(req.headers.get('content-length')||0);if(!Number.isFinite(length)||length>16000)return null;
 try{const v:unknown=await req.json();return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;}catch{return null;}
}
const categoryData=(data:Record<string,unknown>|null)=>{
 if(!data||typeof data.name!=='string'||!data.name.trim()||data.name.length>255||typeof data.email!=='string'||!data.email.trim()||data.email.length>255||![0,1].includes(data.status as number))return null;
 return {name:data.name.trim(),email:data.email.trim(),status:data.status as number};
};
async function rowById(db:PoolConnection,id:number){const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${rowSql} FROM ticket_categories WHERE ticket_category_id=? LIMIT 1 FOR UPDATE`,[id]);return rows[0]??null;}
async function transaction<T>(fn:(conn:PoolConnection)=>Promise<T>):Promise<T>{
 const db=localAccountDatabase();if(!db)throw Error('NO_DATABASE');
 const conn=await db.getConnection();try{await conn.beginTransaction();const out=await fn(conn);await conn.commit();return out;}
 catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
const failure=()=>reply({message:'Ticket category operation unavailable.'},503);
export async function createCategory(req:NextRequest):Promise<Response>{
 const denied=categoryWriteGate(req);if(denied)return denied;
 const data=categoryData(await jsonBody(req));if(!data)return bad();
 try{const row=await transaction(async conn=>{
  const [result]=await conn.execute<ResultSetHeader>('INSERT INTO ticket_categories (uuid,name,email,status,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())',[randomUUID(),data.name,data.email,data.status]);
  return rowById(conn,result.insertId);
 });return reply({message:'Ticket Category created',ticketCategory:row},201);
 }catch{return failure();}
}
export async function updateCategory(req:NextRequest,raw:string):Promise<Response>{
 const denied=categoryWriteGate(req);if(denied)return denied;
 const id=positive(raw);if(!id)return bad();const data=categoryData(await jsonBody(req));if(!data)return bad();
 try{return await transaction(async conn=>{
  if(!await rowById(conn,id))return reply({message:'Ticket Category not found'},404);
  await conn.execute('UPDATE ticket_categories SET name=?,email=?,status=?,updated_at=NOW() WHERE ticket_category_id=?',[data.name,data.email,data.status,id]);
  return reply({message:'Ticket Category updated',ticketCategory:await rowById(conn,id)});
 });}catch{return failure();}
}
export async function statusCategory(req:NextRequest,raw:string):Promise<Response>{
 const denied=categoryWriteGate(req);if(denied)return denied;const id=positive(raw);if(!id)return bad();
 const data=await jsonBody(req);if(!data||![0,1].includes(data.status as number))return reply({message:'Invalid status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await transaction(async conn=>{
  if(!await rowById(conn,id))return reply({message:'Ticket Category not found'},404);
  await conn.execute('UPDATE ticket_categories SET status=?,updated_at=NOW() WHERE ticket_category_id=?',[data.status,id]);
  return reply({message:'Status updated',ticketCategory:await rowById(conn,id)});
 });}catch{return failure();}
}
export async function deleteCategory(req:NextRequest,raw:string):Promise<Response>{
 const denied=categoryWriteGate(req);if(denied)return denied;const id=positive(raw);if(!id)return bad();
 try{return await transaction(async conn=>{
  if(!await rowById(conn,id))return reply({message:'Ticket Category not found'},404);
  await conn.execute('DELETE FROM ticket_categories WHERE ticket_category_id=?',[id]);
  return reply({message:'Ticket Category deleted successfully'});
 });}catch{return failure();}
}
export async function deleteCategories(req:NextRequest):Promise<Response>{
 const denied=categoryWriteGate(req);if(denied)return denied;
 const data=await jsonBody(req),raw=data?.ids;
 if(!Array.isArray(raw)||raw.length===0||raw.length>200)return reply({message:'Please provide an array of IDs to delete.'},400);
 const ids=raw.map(x=>positive(String(x)));
 if(ids.some(x=>x===null)||new Set(ids).size!==ids.length)return bad();
 try{return await transaction(async conn=>{
  const placeholders=ids.map(()=>'?').join(',');
  const [rows]=await conn.query<RowDataPacket[]>(`SELECT ticket_category_id FROM ticket_categories WHERE ticket_category_id IN (${placeholders}) FOR UPDATE`,ids);
  if(!rows.length)return reply({message:'No ticket category found with the given IDs.'},404);
  await conn.query(`DELETE FROM ticket_categories WHERE ticket_category_id IN (${placeholders})`,ids);
  return reply({message:`${rows.length} ticket category deleted successfully.`});
 });}catch{return failure();}
}
