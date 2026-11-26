/** Bulk106: explicit-schema Admin reads and default-OFF status updates.
 * Schema metadata is mapped from original Express Sequelize models and is not a
 * promise of Express response parity. No hard-delete, upload, email or create APIs.
 */
import type { NextRequest } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import catalog from './bulk106-resources.json';
import { authorizedAdminFaq, adminFaqSameOrigin, adminFaqResponse } from '@/lib/localAdminFaqAuth';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { bulk101Id, bulk101Paging } from '@/lib/localBulk101Reads';

type Spec = {table:string,key:string,columns:string[],search:string[],status:boolean,deleted:boolean,filterColumn?:string};
const RESOURCES:Record<string,Spec> = catalog;
export type Bulk106Kind = keyof typeof catalog;
export type Bulk106Action='list'|'count'|'serverSide'|'detail'|'status';
export const BULK106_RESOURCE_NAMES=Object.freeze(Object.keys(RESOURCES));
export function bulk106Kind(name:string):Bulk106Kind|null {
 return Object.prototype.hasOwnProperty.call(RESOURCES,name)?name as Bulk106Kind:null;
}
export function bulk106Enabled():boolean {return process.env.LOCAL_ADMIN_BULK106_WRITES_ENABLED === 'true';}
function quote(x:string):string {return '`'+x+'`';} // only for audited static schema identifiers
function send(obj:Record<string,unknown>,status=200){return adminFaqResponse(obj,status);}
export function bulk106SelectSql(kind:Bulk106Kind):string {
 const d=RESOURCES[kind];return `SELECT ${quote(d.key)} AS id, ${d.columns.map(quote).join(', ')} FROM ${quote(d.table)}`;
}
export function bulk106StatusSql(kind:Bulk106Kind):string|null{
 const d=RESOURCES[kind];
 return d.status ? `UPDATE ${quote(d.table)} SET status = ?, updated_at = NOW() WHERE ${quote(d.key)} = ?${d.deleted?' AND is_delete = 0':''}` : null;
}
export function bulk106StatusBody(value:unknown):0|1|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const obj=value as Record<string,unknown>;
 return Object.keys(obj).length===1&&(obj.status===0||obj.status===1)?obj.status:null;
}
export function bulk106SearchClause(kind:Bulk106Kind, search:string, filterId:number|null){
 const d=RESOURCES[kind];
 const where:string[]=[];
 const args:(string|number)[]=[];
 if(d.deleted)where.push('is_delete = 0');
 if(filterId!==null){
  if(!d.filterColumn)return null;
  where.push(`${quote(d.filterColumn)} = ?`);args.push(filterId);
 }
 if(search){
  if(d.search.length===0)return null;
  where.push('('+d.search.map(column=>`${quote(column)} LIKE ?`).join(' OR ')+')');
  args.push(...d.search.map(()=>`%${search}%`));
 }
 return {sql:where.length?' WHERE '+where.join(' AND '):'',args};
}
async function statusBody(req:NextRequest):Promise<unknown>{
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')??''))return null;
 const len=req.headers.get('content-length');
 if(len!==null&&(!/^\d+$/.test(len)||Number(len)>2048))return null;
 try{const raw=await req.text();return raw.length<=2048?JSON.parse(raw):null;}
 catch{return null;}
}
/** Resource kind is statically specified by the generated route file, never from URL input. */
export async function bulk106Handle(req:NextRequest,kind:Bulk106Kind,action:Bulk106Action,rawId?:string):Promise<Response>{
 if(!authorizedAdminFaq(req))return send({message:'Admin session required.'},401);
 const d=RESOURCES[kind];
 if(!d)return send({message:'Unknown resource.'},404);
 if(action==='status'){
  if(!adminFaqSameOrigin(req))return send({message:'Request origin is not allowed.'},403);
  if(!bulk106Enabled())return send({message:'Bulk106 database writes disabled.'},503);
  if(!d.status)return send({message:'Status update is unavailable.'},405);
 }
 const id=action==='detail'||action==='status'?bulk101Id(rawId??''):null;
 if((action==='detail'||action==='status')&&id===null)return send({message:'Invalid ID.'},400);
 let filterId:number|null=null;
 let paging:ReturnType<typeof bulk101Paging>=null;
 let where:{sql:string,args:(string|number)[]}|null=null;
 let sorting='';
 if(action==='list'||action==='serverSide'||action==='count'){
  const query=new URL(req.url).searchParams;
  const search=(query.get('search')??'').trim();
  if(search.length>100)return send({message:'Invalid search.'},400);
  const rawFilter=query.get('filterId');
  if(rawFilter!==null){filterId=bulk101Id(rawFilter);if(filterId===null)return send({message:'Invalid filter.'},400);}
  where=bulk106SearchClause(kind,search,filterId);
  if(!where)return send({message:'Unsupported search or filter.'},400);
  if(action!=='count'){
   paging=bulk101Paging(req.url);if(!paging)return send({message:'Invalid pagination.'},400);
   const sortBy=query.get('sortBy')??'id';
   const sortCol=sortBy==='id'?d.key:d.columns.includes(sortBy)?sortBy:null;
   const dir=query.get('sort')??'DESC';
   if(!sortCol||!['ASC','DESC'].includes(dir))return send({message:'Invalid sort.'},400);
   sorting=` ORDER BY ${quote(sortCol)} ${dir}`;
  }
 }
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{
  if(action==='list'||action==='serverSide'){
   if(!where||!paging)return send({message:'Bad paging.'},400);
   const [rows]=await db.execute<RowDataPacket[]>(`${bulk106SelectSql(kind)}${where.sql}${sorting} LIMIT ? OFFSET ?`,[...where.args,paging.limit,paging.offset]);
   if(action==='list')return send({items:rows,page:paging.page,limit:paging.limit});
   const base=bulk106SearchClause(kind,'',filterId);
   if(!base)return send({message:'Bad filter.'},400);
   const [total]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${quote(d.table)}${base.sql}`,base.args);
   const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${quote(d.table)}${where.sql}`,where.args);
   return send({data:rows,totalRecords:Number(total[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0),page:paging.page,limit:paging.limit});
  }
  if(action==='count'){
   if(!where)return send({message:'Invalid filter.'},400);
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${quote(d.table)}${where.sql}`,where.args);
   return send({total:Number(rows[0]?.total??0)});
  }
  if(action==='detail'){
   const whereClause=d.deleted?' AND is_delete = 0':'';
   const [rows]=await db.execute<RowDataPacket[]>(`${bulk106SelectSql(kind)} WHERE ${quote(d.key)} = ?${whereClause} LIMIT 1`,[id]);
   return rows[0]?send({item:rows[0]}):send({message:'Not found.'},404);
  }
  if(action==='status'){
   const body=bulk106StatusBody(await statusBody(req));
   if(body===null)return send({message:'Invalid status.'},400);
   const sql=bulk106StatusSql(kind);
   if(!sql)return send({message:'Status update unavailable.'},405);
   const [result]=await db.execute<ResultSetHeader>(sql,[body,id]);
   return result.affectedRows?send({success:true,id,status:body}):send({message:'Not found.'},404);
  }
  return send({message:'Operation unavailable.'},405);
 }catch{return send({message:'Local management operation unavailable.'},503);}
}
