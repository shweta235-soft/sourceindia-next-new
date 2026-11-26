/** Bulk107: explicitly opted-in Admin content/catalog writes.
 * No bulk destructive operations, emails, uploads, or changes to the original DB schema.
 * These new handlers are not asserted equivalent to every Express controller behavior.
 */
import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import { authorizedAdminFaq, adminFaqSameOrigin, adminFaqResponse } from '@/lib/localAdminFaqAuth';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { bulk101Id } from '@/lib/localBulk101Reads';
import catalog from '@/lib/bulk106-resources.json';
import { BULK107_CONFIG, bulk107Parse } from '@/lib/localBulk107Contracts';

export type Bulk107Action='create'|'update'|'delete';
const MODELS:Record<string,{table:string;key:string;deleted:boolean;columns:string[]}> = catalog;
const send=(msg:Record<string,unknown>,code=200)=>adminFaqResponse(msg,code);
const quote=(s:string)=>'`'+s+'`'; // identifiers come only from audited static specs
export const bulk107WriteEnabled=()=>process.env.LOCAL_ADMIN_BULK107_WRITES_ENABLED==='true';

export function bulk107Sql(kind:string, action:Bulk107Action, data?:Record<string,unknown>):string|null {
 const d=MODELS[kind], spec=BULK107_CONFIG[kind];if(!d||!spec)return null;
 if(action==='delete'){
  if(!spec.softDelete||!d.deleted)return null;
  return `UPDATE ${quote(d.table)} SET is_delete = 1, updated_at = NOW() WHERE ${quote(d.key)} = ? AND is_delete = 0`;
 }
 if(!data||Object.keys(data).length===0)return null;
 const fields=Object.keys(data);
 if(fields.some(f=>!(f==='slug'&&spec.slug)&&!Object.prototype.hasOwnProperty.call(spec.fields,f)))return null;
 if(fields.some(f=>!d.columns.includes(f)))return null;
 if(action==='create'){
  const cols=spec.uuid?['uuid',...fields]:fields;
  return `INSERT INTO ${quote(d.table)} (${cols.map(quote).join(', ')}, created_at, updated_at) VALUES (${cols.map(()=>'?').join(', ')}, NOW(), NOW())`;
 }
 if(action==='update'){
  // Protected system pages may be edited only when is_edit=1.
  const guard=kind==='static-pages'?' AND is_edit = 1':'';
  return `UPDATE ${quote(d.table)} SET ${fields.map(f=>`${quote(f)} = ?`).join(', ')}, updated_at = NOW() WHERE ${quote(d.key)} = ?${d.deleted?' AND is_delete = 0':''}${guard}`;
 }
 return null;
}
async function jsonBody(req:NextRequest):Promise<unknown>{
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return null;
 const size=req.headers.get('content-length');
 if(size!==null&&(!/^\d+$/.test(size)||Number(size)>24576))return null;
 try {const body=await req.text();return body.length<=24576?JSON.parse(body):null;}catch{return null;}
}
/** All kind and action arguments originate from constant route files, never user input. */
export async function bulk107Handle(req:NextRequest,kind:string,action:Bulk107Action,rawId?:string):Promise<Response> {
 if(!authorizedAdminFaq(req))return send({message:'Admin session required.'},401);
 if(!BULK107_CONFIG[kind]||!MODELS[kind])return send({message:'Unsupported module.'},404);
 if(!adminFaqSameOrigin(req))return send({message:'Origin mismatch.'},403);
 if(!bulk107WriteEnabled())return send({message:'Bulk107 writes disabled. Set LOCAL_ADMIN_BULK107_WRITES_ENABLED=true only in an isolated test environment.'},503);
 if(action==='delete'&&!BULK107_CONFIG[kind].softDelete)return send({message:'Destructive deletion is not implemented.'},409);
 const id=action!=='create'?bulk101Id(rawId??''):null;
 if(action!=='create' && id===null)return send({message:'Invalid ID.'},400);
 const body=action==='delete'?null:bulk107Parse(kind,await jsonBody(req),action==='create'?'create':'update');
 if(action!=='delete'&&!body)return send({message:'Invalid fields or missing required fields.'},400);
 const sql=bulk107Sql(kind,action,body??undefined);if(!sql)return send({message:'Operation unavailable.'},405);
 const d=MODELS[kind];const db=localAccountDatabase();
 if(!db)return send({message:'Local database unavailable.'},503);
 const args:unknown[]=action==='delete'?[id]:action==='create'?[...(BULK107_CONFIG[kind].uuid?[randomUUID()]:[]),...Object.values(body!)]:[...Object.values(body!),id];
 try {
  const [result]=await db.execute<ResultSetHeader>(sql,args);
  if(action!=='create'&&result.affectedRows===0)return send({message:'Not found or not editable.'},404);
  return action==='create'?send({success:true,id:result.insertId},201):send({success:true,id,softDeleted:action==='delete'});
 }catch(e:unknown){
  if(e&&typeof e==='object'&&'code' in e&&(e as {code?:string}).code==='ER_DUP_ENTRY')return send({message:'Duplicate value.'},409);
  return send({message:'Local management write unavailable.'},503);
 }
}
