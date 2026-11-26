/** Bulk104: explicit-schema Admin-only local management APIs.
 * These are deliberately NOT a claim of one-to-one Express response parity.
 * All database mutations require LOCAL_ADMIN_BULK104_WRITES_ENABLED=true.
 * Hard-deletes, external file uploads and email sends are not implemented.
 */
import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { authorizedAdminFaq, adminFaqSameOrigin, adminFaqResponse } from '@/lib/localAdminFaqAuth';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { bulk101Id, bulk101Paging } from '@/lib/localBulk101Reads';

type Type = 'text' | 'optionalText' | 'url' | 'int' | 'optionalInt' | 'bit';
type Field = { type: Type; max?: number; min?: number };
type Spec = {
  table: string;
  key: string;
  display: readonly string[];
  search: readonly string[];
  edit?: Readonly<Record<string, Field>>;
  softDelete: boolean;
  status: boolean;
};

// All table names, column identifiers and sort fields are static audited identifiers.
// User input is ONLY interpolated as values via mysql2 placeholders.
export const BULK104_RESOURCES = {
  roles: {
    table: 'roles', key: 'role_id',
    display: ['uuid', 'name', 'ticket_category', 'status', 'is_delete', 'created_at', 'updated_at'],
    search: ['name'], edit: { name: {type:'text',max:255}, ticket_category:{type:'int',min:1}, status:{type:'bit'} }, softDelete:true,status:true,
  },
  activities: {
    table:'activities', key:'activity_id',
    display:['uuid','name','coreactivity','status','is_delete','created_at','updated_at'],
    search:['name'],edit:{name:{type:'text',max:255},coreactivity:{type:'int',min:1},status:{type:'bit'}},softDelete:true,status:true,
  },
  'core-activities': {
    table:'core_activities',key:'core_activity_id',
    display:['uuid','name','color','file_id','status','is_delete','created_at','updated_at'],
    search:['name'],edit:{name:{type:'text',max:255},color:{type:'text',max:255},file_id:{type:'int',min:1},status:{type:'bit'}},softDelete:true,status:true,
  },
  applications: {
    table:'applications',key:'application_id',
    display:['uuid','name','cat_file_id','stock_file_id','prefix','status','top_category','is_delete','created_at','updated_at'],
    search:['name','prefix'],edit:{name:{type:'text',max:255},cat_file_id:{type:'int',min:0},stock_file_id:{type:'optionalInt',min:0},prefix:{type:'optionalText',max:255},status:{type:'bit'},top_category:{type:'int',min:0}},softDelete:true,status:true,
  },
  'membership-plans': {
    table:'membership_plans',key:'membership_plan_id',
    display:['uuid','name','sub_title','status','price','free','user','enquiries','category','product','is_default','expire_days','is_delete','elcina_plan','created_at','updated_at'],
    search:['name','sub_title'],edit:{name:{type:'text',max:255},sub_title:{type:'optionalText',max:255},status:{type:'bit'},price:{type:'int',min:0},free:{type:'optionalInt',min:0},user:{type:'int',min:0},enquiries:{type:'int',min:0},category:{type:'int',min:0},product:{type:'int',min:0},is_default:{type:'optionalInt',min:0},expire_days:{type:'int',min:1},elcina_plan:{type:'optionalInt',min:0}},softDelete:true,status:true,
  },
  'interest-subcategories': {
    table:'interest_sub_categories',key:'interest_sub_category_id',
    display:['uuid','name','interest_category_id','status','created_at','updated_at'],
    search:['name'],edit:{name:{type:'text',max:255},interest_category_id:{type:'int',min:1},status:{type:'bit'}},softDelete:false,status:true,
  },
  'shortcut-menus': {
    table:'shortcut_menus',key:'shortcut_id',
    display:['uuid','name','link','status','is_delete','created_at','updated_at'],
    search:['name'],edit:{name:{type:'text',max:255},link:{type:'url',max:255},status:{type:'bit'}},softDelete:true,status:true,
  },
  contacts: {
    table:'contacts',key:'contact_id',
    display:['uuid','fname','lname','email','subject','message','is_delete','created_at','updated_at'],
    search:['fname','lname','email','subject'],softDelete:true,status:false,
  },
} as const satisfies Record<string, Spec>;

export type Bulk104Kind = keyof typeof BULK104_RESOURCES;
export type Bulk104Action = 'list'|'count'|'serverSide'|'detail'|'create'|'update'|'status'|'delete'|'deleteSelected';
export function bulk104Kind(input:string): Bulk104Kind | null {
  return Object.prototype.hasOwnProperty.call(BULK104_RESOURCES,input) ? input as Bulk104Kind : null;
}
export function bulk104WriteEnabled():boolean {return process.env.LOCAL_ADMIN_BULK104_WRITES_ENABLED === 'true';}
// Identifiers are selected only from compiled-in schema configs, never from request input.
function q(column:string):string {return '`'+column+'`';}
export function bulk104SelectSql(kind:Bulk104Kind) {
  const d:Spec=BULK104_RESOURCES[kind];
  return `SELECT ${q(d.key)} AS id, ${d.display.map(q).join(', ')} FROM ${q(d.table)}`;
}
export function bulk104Where(kind:Bulk104Kind) {
  return BULK104_RESOURCES[kind].softDelete?' WHERE is_delete = 0':' WHERE 1 = 1';
}
export function bulk104WriteSql(kind:Bulk104Kind,action:'create'|'update'|'status'|'delete'|'deleteSelected') {
  const d:Spec=BULK104_RESOURCES[kind];
  if(action==='delete') {
    if(!d.softDelete)return null;
    return `UPDATE ${q(d.table)} SET is_delete = 1, updated_at = NOW() WHERE ${q(d.key)} = ? AND is_delete = 0`;
  }
  if(action==='deleteSelected')return null; // Bulk SQL builds bounded placeholders only after validating IDs.
  if(action==='status')return d.status?`UPDATE ${q(d.table)} SET status = ?, updated_at = NOW() WHERE ${q(d.key)} = ?${d.softDelete?' AND is_delete = 0':''}`:null;
  if(!d.edit)return null;
  const cols=Object.keys(d.edit);
  if(action==='create')return `INSERT INTO ${q(d.table)} (uuid, ${cols.map(q).join(', ')}, created_at, updated_at) VALUES (?, ${cols.map(()=>'?').join(', ')}, NOW(), NOW())`;
  return `UPDATE ${q(d.table)} SET ${cols.map(c=>q(c)+' = ?').join(', ')}, updated_at = NOW() WHERE ${q(d.key)} = ?${d.softDelete?' AND is_delete = 0':''}`;
}

export function bulk104Parse(kind:Bulk104Kind,value:unknown): unknown[]|null {
  const d:Spec=BULK104_RESOURCES[kind];
  if(!d.edit||!value||typeof value!=='object'||Array.isArray(value))return null;
  const fields:Record<string,Field>=d.edit;
  const raw=value as Record<string,unknown>;
  const keys=Object.keys(fields);
  if(Object.keys(raw).length!==keys.length||!Object.keys(raw).every(k=>Object.prototype.hasOwnProperty.call(fields,k)))return null;
  const out:unknown[]=[];
  for(const k of keys){
    const field=fields[k],v=raw[k];
    if(field.type==='optionalText'||field.type==='optionalInt') {
      if(v===null||v===''){out.push(null);continue;}
    }
    if(field.type==='bit') {
      if(v!==0&&v!==1)return null;
      out.push(v);continue;
    }
    if(field.type==='int'||field.type==='optionalInt'){
      if(typeof v!=='number'||!Number.isSafeInteger(v)||v<(field.min??0)||v>2147483647)return null;
      out.push(v);continue;
    }
    if(typeof v!=='string'||!v.trim()||v.length>(field.max??255)||/[\x00-\x1f]/.test(v))return null;
    if(field.type==='url' && !(/^(https:\/\/[^\s<>"']+|\/(?!\/)[a-zA-Z0-9_/?#=%&.+-]+)$/.test(v))) return null;
    out.push(v.trim());
  }
  return out;
}

export function bulk104Ids(value:unknown):number[]|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const r=value as Record<string,unknown>;
  if(Object.keys(r).length!==1||!Array.isArray(r.ids)||r.ids.length<1||r.ids.length>100)return null;
  const ids=r.ids.map(v=>typeof v==='number'?bulk101Id(String(v)):null);
  return ids.every((v):v is number=>v!==null)?[...new Set(ids as number[])]:null;
}

async function readJson(req:NextRequest):Promise<unknown>{
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')??''))return null;
  const len=req.headers.get('content-length');
  if(len!==null && (!/^\d+$/.test(len)||Number(len)>32000))return null;
  try { const input=await req.text();return input.length<=32000?JSON.parse(input):null;}catch{return null;}
}
function send(body:Record<string,unknown>,status=200):Response {return adminFaqResponse(body,status);}

/** Single authenticated dispatcher, used only by statically whitelisted route files. */
export async function bulk104Handle(req:NextRequest, kind:Bulk104Kind, action:Bulk104Action, rawId?:string):Promise<Response>{
  if(!authorizedAdminFaq(req))return send({message:'Admin session required.'},401);
  const d:Spec=BULK104_RESOURCES[kind];
  const writing=['create','update','status','delete','deleteSelected'].includes(action);
  if(writing){
    if(!adminFaqSameOrigin(req))return send({message:'Request origin is not allowed.'},403);
    if(!bulk104WriteEnabled())return send({message:'Bulk104 database writes disabled.'},503);
  }
  const id = ['detail','update','status','delete'].includes(action)?bulk101Id(rawId||''):null;
  if(['detail','update','status','delete'].includes(action)&&id===null)return send({message:'Invalid ID.'},400);
  if(writing && (action==='create'||action==='update')&&!d.edit)return send({message:'This operation is not supported.'},405);
  if(writing && ((action==='delete'||action==='deleteSelected')&&!d.softDelete))return send({message:'Hard deletion is deliberately disabled for this resource.'},409);
  if(writing && action==='status'&&!d.status)return send({message:'Status update is not supported.'},405);
  const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
  try{
    const where=bulk104Where(kind);
    const base=bulk104SelectSql(kind);
    if(action==='list'||action==='serverSide'){
      const paging=bulk101Paging(req.url);if(!paging)return send({message:'Invalid pagination.'},400);
      const qs=new URL(req.url).searchParams;
      const search=(qs.get('search')||'').trim();
      if(search.length>100)return send({message:'Invalid search.'},400);
      const sortKey=qs.get('sortBy')||'id';
      const sortField=sortKey==='id'?d.key:d.display.includes(sortKey)?sortKey:null;
      if(!sortField)return send({message:'Invalid sort.'},400);
      const dir=qs.get('sort')==='ASC'?'ASC':'DESC';
      const conditions=search && d.search.length?` AND (${d.search.map(c=>`${q(c)} LIKE ?`).join(' OR ')})`:'';
      const params=search&&d.search.length?d.search.map(()=>`%${search}%`):[];
      const [rows]=await db.execute<RowDataPacket[]>(`${base}${where}${conditions} ORDER BY ${q(sortField)} ${dir} LIMIT ? OFFSET ?`,[...params,paging.limit,paging.offset]);
      if(action==='list')return send({items:rows,page:paging.page,limit:paging.limit});
      const [total]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${q(d.table)}${where}`);
      const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${q(d.table)}${where}${conditions}`,params);
      return send({data:rows,totalRecords:Number(total[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0),page:paging.page,limit:paging.limit});
    }
    if(action==='count'){
      const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${q(d.table)}${where}`);
      return send({total:Number(rows[0]?.total??0)});
    }
    if(action==='detail'){
      const [rows]=await db.execute<RowDataPacket[]>(`${base}${where} AND ${q(d.key)} = ? LIMIT 1`,[id]);
      return rows[0]?send({item:rows[0]}):send({message:'Not found.'},404);
    }
    const body=await readJson(req);
    if(action==='create'||action==='update'){
      const vals=bulk104Parse(kind,body);if(!vals)return send({message:'Invalid input.'},400);
      const sql=bulk104WriteSql(kind,action);if(!sql)return send({message:'Not supported.'},405);
      const args=action==='create'?[randomUUID(),...vals]:[...vals,id];
      const [result]=await db.execute<ResultSetHeader>(sql,args);
      if(action==='update'&&!result.affectedRows)return send({message:'Not found.'},404);
      return send({success:true,id:action==='create'?result.insertId:id},action==='create'?201:200);
    }
    if(action==='status'){
      if(!body||typeof body!=='object'||Array.isArray(body))return send({message:'Invalid status.'},400);
      const b=body as Record<string,unknown>;
      if(Object.keys(b).length!==1||(b.status!==0&&b.status!==1))return send({message:'Invalid status.'},400);
      const sql=bulk104WriteSql(kind,'status');if(!sql)return send({message:'Not supported.'},405);
      const [result]=await db.execute<ResultSetHeader>(sql,[b.status,id]);
      return result.affectedRows?send({success:true,id,status:b.status}):send({message:'Not found.'},404);
    }
    if(action==='delete'){
      const sql=bulk104WriteSql(kind,'delete');if(!sql)return send({message:'Deletion not supported.'},409);
      const [result]=await db.execute<ResultSetHeader>(sql,[id]);
      return result.affectedRows?send({success:true,id,softDeleted:true}):send({message:'Not found.'},404);
    }
    if(action==='deleteSelected'){
      const ids=bulk104Ids(body);if(!ids)return send({message:'Invalid ID list.'},400);
      const placeholders=ids.map(()=>'?').join(', ');
      const [result]=await db.execute<ResultSetHeader>(`UPDATE ${q(d.table)} SET is_delete = 1, updated_at=NOW() WHERE ${q(d.key)} IN (${placeholders}) AND is_delete=0`,ids);
      return send({success:true,softDeleted:true,count:result.affectedRows});
    }
    return send({message:'Operation not supported.'},405);
  }catch{return send({message:'Local management operation unavailable.'},503);}
}
