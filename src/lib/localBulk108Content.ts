/** Bulk108: audited Admin-specific newsletter, email-template and registration APIs.
 * Compare with original Express controllers before enabling writes in an isolated test DB.
 * This module never sends emails, manages uploads or performs physical DELETE.
 */
import {randomUUID} from 'node:crypto';
import type {NextRequest} from 'next/server';
import type {ResultSetHeader,RowDataPacket} from 'mysql2';
import {authorizedAdminFaq,adminFaqSameOrigin,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {bulk108Clone,bulk108DeleteStatus,bulk108EmailInput,bulk108NewsletterEdit,bulk108Order,bulk108Paging,bulk108PositiveId,bulk108Search,bulk108SelectedIds,bulk108Like} from '@/lib/localBulk108Contracts';

type Kind='email-templates'|'newsletter-circulars'|'registrations';
type Action='list'|'count'|'detail'|'serverSide'|'create'|'update'|'clone'|'delete'|'userTypes'|'deleteStatus'|'deleteSelected';
type Args=(number|string|Buffer|null)[];
const send=(body:Record<string,unknown>,status=200)=>adminFaqResponse(body,status);
const allowWrite=()=>process.env.LOCAL_ADMIN_BULK108_WRITES_ENABLED==='true';
const cols={
 'email-templates':`e.email_id AS id, e.uuid, e.title, e.email_for, e.description, e.subject,
   e.is_seller_direct, CONVERT(e.message USING utf8mb4) AS message, e.status, e.created_at, e.updated_at`,
 'newsletter-circulars':`n.newsletter_id AS id, n.uuid, n.title, n.subject, n.description, n.user_type,
   n.ip_address, n.country, n.location, n.history_type, n.city, n.attachment, n.is_delete,
   u.name AS user_category_name, n.created_at, n.updated_at`,
 'registrations':`r.registration_id AS id, r.uuid, r.category, r.name, r.designation,
   r.organization, r.email, r.mobile, r.state, r.city, r.is_delete,
   s.name AS state_name, c.name AS city_name, r.created_at, r.updated_at`
} as const;
const table={
 'email-templates':'emails e',
 'newsletter-circulars':'news_latters n LEFT JOIN user_category u ON u.user_category_id = n.user_type',
 'registrations':'registrations r LEFT JOIN states s ON s.state_id = r.state LEFT JOIN cities c ON c.city_id = r.city'
} as const;
const pk={'email-templates':'e.email_id','newsletter-circulars':'n.newsletter_id','registrations':'r.registration_id'} as const;
const sorts={
 'email-templates':{id:'e.email_id',title:'e.title',email_for:'e.email_for',subject:'e.subject',status:'e.status',created_at:'e.created_at',updated_at:'e.updated_at'},
 'newsletter-circulars':{id:'n.newsletter_id',title:'n.title',user_type_name:'u.name',created_at:'n.created_at',updated_at:'n.updated_at'},
 'registrations':{id:'r.registration_id',category:'r.category',name:'r.name',designation:'r.designation',organization:'r.organization',email:'r.email',state_name:'s.name',city_name:'c.name',created_at:'r.created_at',updated_at:'r.updated_at'}
} as const;
const exactKind=(v:string):v is Kind=>v==='email-templates'||v==='newsletter-circulars'||v==='registrations';

async function readJson(req:NextRequest):Promise<unknown> {
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')??''))return null;
 const len=req.headers.get('content-length');
 if(len!==null&&(!/^\d+$/.test(len)||Number(len)>120000))return null;
 try{const raw=await req.text();return raw.length<=120000?JSON.parse(raw):null;}catch{return null;}
}
function filters(kind:Kind,req:NextRequest){
 const search=bulk108Search(req.url);if(search===null)return null;
 const q=new URL(req.url).searchParams;
 const clauses:string[]=[],args:Args=[];
 if(kind==='newsletter-circulars'||kind==='registrations'){
  const deleted=q.get('getDeleted');
  if(deleted!==null&&!['true','false'].includes(deleted))return null;
  clauses.push(`${kind==='registrations'?'r':'n'}.is_delete = ?`);
  args.push(deleted==='true'?1:0);
 }
 if(kind==='email-templates'){
  const emailFor=(q.get('emailFor')??'').trim();
  if(emailFor.length>100)return null;
  if(emailFor){clauses.push('e.email_for LIKE ?');args.push(bulk108Like(emailFor));}
  if(search==='active'||search==='inactive'){
   clauses.push('e.status = ?');args.push(search==='active'?1:0);
  }else if(search){clauses.push('(e.title LIKE ? OR e.email_for LIKE ? OR e.subject LIKE ?)');args.push(...Array(3).fill(bulk108Like(search)));}
 }else if(kind==='newsletter-circulars'){
  if(search){clauses.push('(n.title LIKE ? OR u.name LIKE ?)');args.push(bulk108Like(search),bulk108Like(search));}
 }else{
  for(const [param,column] of [['state','r.state'],['city','r.city']] as const){
   const raw=q.get(param);if(raw!==null){const id=bulk108PositiveId(raw);if(id===null)return null;clauses.push(`${column} = ?`);args.push(id);}
  }
  const registrationCategory=(q.get('registrationCategory')??'').trim();if(registrationCategory.length>100)return null;
  if(registrationCategory){clauses.push('r.category = ?');args.push(registrationCategory);}
  for(const [param,column] of [['registrationName','r.name'],['registrationEmail','r.email'],['registrationMobile','r.mobile']] as const){
   const raw=(q.get(param)??'').trim();if(raw.length>100)return null;
   if(raw){clauses.push(`${column} LIKE ?`);args.push(bulk108Like(raw));}
  }
  if(search){clauses.push('(r.category LIKE ? OR r.name LIKE ? OR r.organization LIKE ? OR r.email LIKE ? OR r.designation LIKE ? OR s.name LIKE ? OR c.name LIKE ?)');args.push(...Array(7).fill(bulk108Like(search)));}
 }
 return {where:clauses.length?' WHERE '+clauses.join(' AND '):'',args};
}
async function write(kind:Kind,action:Action,req:NextRequest,id:number|null):Promise<Response>{
 // No valid write is possible unless authenticated, same-origin and explicitly opted in.
 if(!adminFaqSameOrigin(req))return send({message:'Origin mismatch.'},403);
 if(!allowWrite())return send({message:'Bulk108 writes disabled. Set LOCAL_ADMIN_BULK108_WRITES_ENABLED=true only against an isolated disposable database.'},503);
 // Never physically delete, upload attachments or trigger email delivery in this release.
 if(action==='delete')return send({message:'Physical delete blocked; no database rows were modified.'},409);
 if(action==='create'&&kind==='newsletter-circulars')return send({message:'Newsletter create requires validated multipart file upload; unavailable until storage transaction is implemented.'},409);
 if(!['create','update','clone','deleteStatus','deleteSelected'].includes(action))return send({message:'Unsupported mutation.'},405);
 if(kind==='registrations'&&!['deleteStatus','deleteSelected'].includes(action))return send({message:'Registration creation is handled by public signup flow.'},405);
 if(kind==='newsletter-circulars'&&action!=='update')return send({message:'Newsletter mutation is unsupported.'},405);
 if(kind==='email-templates'&&!['create','update','clone'].includes(action))return send({message:'Email mutation is unsupported.'},405);
 if(['update','deleteStatus'].includes(action)&&id===null)return send({message:'Invalid ID.'},400);
 const raw=await readJson(req);
 let payload:Record<string,unknown>|null=null;
 let cloneId:number|null=null,deleteStatus:0|1|null=null,ids:number[]|null=null;
 if(kind==='email-templates'){
  if(action==='clone')cloneId=bulk108Clone(raw);
  else payload=bulk108EmailInput(raw,action==='create');
  if((action==='clone'&&cloneId===null)||(action!=='clone'&&!payload))return send({message:'Invalid email template fields.'},400);
 }else if(kind==='newsletter-circulars'){
  payload=bulk108NewsletterEdit(raw);
  if(!payload)return send({message:'Invalid newsletter fields.'},400);
 }else{
  if(action==='deleteStatus')deleteStatus=bulk108DeleteStatus(raw);
  else ids=bulk108SelectedIds(raw);
  if((action==='deleteStatus'&&deleteStatus===null)||(action==='deleteSelected'&&ids===null))return send({message:'Invalid deletion status or IDs.'},400);
 }
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{
  if(kind==='email-templates'&&action==='clone'){
   const [result]=await db.execute<ResultSetHeader>(`INSERT INTO emails
    (uuid,title,email_for,subject,description,message,is_seller_direct,status,created_at,updated_at)
    SELECT ?, CONCAT(title, ' (Clone)'), email_for, subject, description, message, is_seller_direct, status, NOW(), NOW()
    FROM emails WHERE email_id = ?`,[randomUUID(),cloneId]);
   return result.affectedRows?send({success:true,newId:result.insertId},201):send({message:'Email template not found.'},404);
  }
  if(kind==='registrations'){
   if(action==='deleteStatus'){
    const [res]=await db.execute<ResultSetHeader>('UPDATE registrations SET is_delete = ?, updated_at = NOW() WHERE registration_id = ?', [deleteStatus,id]);
    return res.affectedRows?send({success:true,id,is_delete:deleteStatus}):send({message:'Registration not found.'},404);
   }
   const placeholders=ids!.map(()=>'?').join(',');
   const [res]=await db.execute<ResultSetHeader>(`UPDATE registrations SET is_delete = 1, updated_at = NOW() WHERE registration_id IN (${placeholders}) AND is_delete = 0`,ids!);
   return send({success:true,affectedRows:res.affectedRows});
  }
  const data=payload!;const fields=Object.keys(data);
  if(kind==='email-templates'){
   if(action==='create'){
    const cols=['uuid',...fields,'created_at','updated_at'];
    const vals=[randomUUID(),...Object.values(data),...[]];
    const sql=`INSERT INTO emails (${cols.map(k=>'`'+k+'`').join(', ')}) VALUES (${vals.map(()=>'?').join(', ')}, NOW(), NOW())`;
    const [res]=await db.execute<ResultSetHeader>(sql,vals);
    return send({success:true,id:res.insertId},201);
   }
   const sql=`UPDATE emails SET ${fields.map(f=>'`'+f+'` = ?').join(', ')},updated_at = NOW() WHERE email_id = ?`;
   const [res]=await db.execute<ResultSetHeader>(sql,[...Object.values(data),id]);
   return res.affectedRows?send({success:true,id}):send({message:'Email template not found.'},404);
  }
  const sql=`UPDATE news_latters SET ${fields.map(f=>'`'+f+'` = ?').join(', ')},updated_at = NOW() WHERE newsletter_id = ? AND is_delete = 0`;
  const [res]=await db.execute<ResultSetHeader>(sql,[...Object.values(data),id]);
  return res.affectedRows?send({success:true,id}):send({message:'Newsletter not found.'},404);
 }catch(error:unknown){
  if(error&&typeof error==='object'&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY')return send({message:'Duplicate value.'},409);
  return send({message:'Local Admin write unavailable.'},503);
 }
}
export async function bulk108ContentHandle(req:NextRequest,kind:string,action:Action,rawId?:string):Promise<Response>{
 if(!authorizedAdminFaq(req))return send({message:'Admin session required.'},401);
 if(!exactKind(kind))return send({message:'Unknown module.'},404);
 const id=rawId===undefined?null:bulk108PositiveId(rawId);
 if(rawId!==undefined&&id===null)return send({message:'Invalid ID.'},400);
 if(['create','update','clone','delete','deleteStatus','deleteSelected'].includes(action))return write(kind,action,req,id);
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 if(action==='userTypes'){
  if(kind!=='newsletter-circulars')return send({message:'Unsupported lookup.'},405);
  try{const [rows]=await db.execute<RowDataPacket[]>('SELECT user_category_id AS id, name, status, type, user_type FROM user_category ORDER BY user_category_id ASC LIMIT 500');return send({items:rows});}
  catch{return send({message:'User categories read failed.'},503);}
 }
 if(action==='detail'&&id===null)return send({message:'Invalid ID.'},400);
 const where=filters(kind,req);
 if(!where)return send({message:'Invalid filter or search query.'},400);
 const paging=(action==='list'||action==='serverSide')?bulk108Paging(req.url):null;
 if((action==='list'||action==='serverSide')&&!paging)return send({message:'Invalid pagination.'},400);
 const order=(action==='list'||action==='serverSide')?bulk108Order(req.url,sorts[kind]):'';
 if(order===null)return send({message:'Invalid sort.'},400);
 try{
  if(action==='detail'){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${cols[kind]} FROM ${table[kind]} WHERE ${pk[kind]} = ? LIMIT 1`,[id]);
   const entry=rows[0];if(!entry)return send({message:'Not found.'},404);
   if(kind==='newsletter-circulars'){
    const attachment=typeof entry.attachment==='string'?entry.attachment:'';
    const fileIds=attachment.split(',').filter(x=>/^\d{1,10}$/.test(x)).map(Number).filter(n=>n>0).slice(0,40);
    if(fileIds.length){const [images]=await db.execute<RowDataPacket[]>(`SELECT upload_image_id AS id,file FROM upload_images WHERE upload_image_id IN (${fileIds.map(()=>'?').join(',')})`,fileIds);return send({item:{...entry,images}});}
    return send({item:{...entry,images:[]}});
   }
   return send({item:entry});
  }
  if(action==='count'){
   if(kind==='registrations'){
    const [rows]=await db.execute<RowDataPacket[]>(`SELECT SUM(is_delete=0) AS total,SUM(is_delete=1) AS deleted FROM registrations`);
    return send({total:Number(rows[0]?.total??0),deleted:Number(rows[0]?.deleted??0)});
   }
   if(kind==='email-templates'){
    const [rows]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM emails');return send({total:Number(rows[0]?.total??0)});
   }
   const [rows]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM news_latters WHERE is_delete = 0');return send({total:Number(rows[0]?.total??0)});
  }
  if(action==='list'||action==='serverSide'){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${cols[kind]} FROM ${table[kind]}${where.where}${order} LIMIT ? OFFSET ?`,[...where.args,paging!.limit,paging!.offset]);
   if(action==='list')return send({items:rows,page:paging!.page,limit:paging!.limit});
   const deleted=new URL(req.url).searchParams.get('getDeleted')==='true';
   const totalWhere=kind==='email-templates'?'':` WHERE ${kind==='registrations'?'r':'n'}.is_delete = ?`;
   const totalArgs=kind==='email-templates'?[]:[deleted?1:0];
   const [tot]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${table[kind]}${totalWhere}`,totalArgs);
   const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${table[kind]}${where.where}`,where.args);
   return send({data:rows,totalRecords:Number(tot[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0),page:paging!.page,limit:paging!.limit});
  }
  return send({message:'Unsupported read.'},405);
 }catch{return send({message:'Local management read unavailable.'},503);}
}
