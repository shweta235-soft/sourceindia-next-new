/** BULK127: native Contacts APIs. Original Express code is used for comparison only.
 * Production writes are forbidden; isolated QA writes must be explicitly enabled.
 * SMTP notifications (templates 61, 59) are QA-only and require recipient allowlist.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader,PoolConnection} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
const unavailable=()=>reply({message:'Contacts unavailable.'},503);
const invalid=()=>reply({message:'Invalid request.'},400);
const idOf=(v:unknown)=>/^[1-9]\d{0,14}$/.test(String(v))&&Number.isSafeInteger(Number(v))?Number(v):null;
const columns='contact_id AS id,uuid,fname,lname,email,subject,message,is_delete,created_at,updated_at';
const sortMap:Record<string,string>={id:'contact_id',fname:'fname',lname:'lname',email:'email',subject:'subject',message:'message',created_at:'created_at',updated_at:'updated_at'};
const safeLike=(s:string)=>s.replace(/[\\%_]/g,x=>'\\'+x);
export async function listContacts():Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{const [rows]=await db.query<RowDataPacket[]>(`SELECT ${columns} FROM contacts ORDER BY contact_id ASC`);return reply(rows);}catch{return unavailable();}
}
export async function countContacts():Promise<Response>{
 const db=localAccountDatabase();if(!db)return unavailable();
 try{const [rows]=await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM contacts WHERE is_delete=0');return reply({total:Number(rows[0]?.total??0)});}catch{return unavailable();}
}
function range(p:URLSearchParams):[string,string]|null|false{
 const v=(p.get('dateRange')??'').toLowerCase().replace(/\s+/g,'');if(!v)return null;
 const now=new Date(),a=new Date(now),b=new Date(now);a.setHours(0,0,0,0);
 const days=(count:number)=>{a.setDate(a.getDate()-count);return [a.toISOString(),b.toISOString()] as [string,string]};
 if(v==='today')return days(0);
 if(v==='yesterday'){a.setDate(a.getDate()-1);b.setTime(a.getTime());b.setHours(23,59,59,999);return [a.toISOString(),b.toISOString()];}
 if(v==='last7days')return days(6);if(v==='last30days')return days(29);
 if(v==='thismonth'){a.setDate(1);return [a.toISOString(),b.toISOString()];}
 if(v==='lastmonth'){a.setDate(1);a.setMonth(a.getMonth()-1);b.setDate(0);b.setHours(23,59,59,999);return [a.toISOString(),b.toISOString()];}
 if(v==='customrange'){
  const start=p.get('startDate'),end=p.get('endDate');
  if(!start||!end||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(start)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(end))return false;
  const s=new Date(start+'T00:00:00'),e=new Date(end+'T23:59:59.999');
  return Number.isFinite(+s)&&Number.isFinite(+e)&&s<=e?[s.toISOString(),e.toISOString()]:false;
 }
 if(/^[1-9]\d{0,3}$/.test(v))return days(Number(v)-1);
 return false;
}
export async function gridContacts(req:NextRequest):Promise<Response>{
 const p=new URL(req.url).searchParams;
 const pageRaw=p.get('page')??'1',limitRaw=p.get('limit')??'10';
 if(!/^[1-9]\d{0,5}$/.test(pageRaw)||!/^[1-9]\d{0,3}$/.test(limitRaw))return invalid();
 const page=Number(pageRaw),limit=Number(limitRaw),offset=(page-1)*limit;
 if(limit>200||!Number.isSafeInteger(offset))return invalid();
 const search=p.get('search')??'';if(search.length>160)return invalid();
 const dates=range(p);if(dates===false)return invalid();
 const deleted=p.get('getDeleted')==='true'?1:0;
 const sortBy=p.get('sortBy')??'id',direction=p.get('sort')==='ASC'||p.get('sort')==='DESC'?p.get('sort')!:p.has('sort')?'ASC':'DESC';
 const order=sortBy==='full_name'?"CONCAT(fname, ' ', lname)":sortMap[sortBy]??'contact_id';
 const where=['is_delete=?'];const args:unknown[]=[deleted];
 if(search){const val='%'+safeLike(search)+'%';where.push("(CONCAT(fname, ' ', lname) LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)");args.push(val,val,val,val);}
 if(dates){where.push('created_at BETWEEN ? AND ?');args.push(...dates);}
 const db=localAccountDatabase();if(!db)return unavailable();
 try{
  const [total]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM contacts WHERE is_delete=?',[deleted]);
  const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM contacts WHERE ${where.join(' AND ')}`,args);
  const [rows]=await db.query<RowDataPacket[]>(`SELECT ${columns} FROM contacts WHERE ${where.join(' AND ')} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...args,limit,offset]);
  return reply({data:rows.map(r=>({id:r.id,full_name:`${r.fname} ${r.lname}`,email:r.email,subject:r.subject,message:r.message,is_delete:r.is_delete,created_at:r.created_at,updated_at:r.updated_at})),totalRecords:Number(total[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0)});
 }catch{return unavailable();}
}
/** Explicit isolated local QA policy; no remote, production, or unapproved origin writes. */
export function contactWriteGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_CONTACT_WRITES_ENABLED!=='1')return reply({message:'Contact writes disabled.'},403);
 if(!['localhost','127.0.0.1','::1'].includes((env.DB_HOST||'').toLowerCase()))return reply({message:'QA database required.'},403);
 const database=env.DB_NAME??'';
 if(!database||database!==env.SOURCEINDIA_CONTACT_QA_DB_NAME||!/(qa|test|sandbox)/i.test(database))return reply({message:'QA database required.'},403);
 const secret=env.SOURCEINDIA_CONTACT_QA_TOKEN??'',authorization=req.headers.get('authorization')??'';
 const token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return reply({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return reply({message:'Origin denied.'},403);}catch{return reply({message:'Origin denied.'},403);}}
 return null;
}
async function parseBody(req:NextRequest):Promise<Record<string,unknown>|null>{
 const type=req.headers.get('content-type')??'',size=Number(req.headers.get('content-length')||0);
 if(!Number.isFinite(size)||size>16000)return null;
 try{
  if(type.startsWith('application/json')){const data:unknown=await req.json();return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null;}
  if(type.startsWith('application/x-www-form-urlencoded')){const raw=await req.text();if(raw.length>16000)return null;const p=new URLSearchParams(raw),out:Record<string,unknown>={};for(const [k,v] of p){if(Object.hasOwn(out,k))return null;out[k]=v;}return out;}
  return null;
 }catch{return null;}
}
const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v)?v.trim():null;
const email=(v:unknown)=>{const s=text(v,254);return s&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null;};
export const mailTemplateIds={admin:61,user:59} as const;
export const htmlEscape=(v:string)=>v.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]||x));
function qaMailConfiguration(user:string){
 const e=process.env,admin=email(e.SOURCEINDIA_CONTACT_QA_ADMIN_EMAIL),from=email(e.SOURCEINDIA_CONTACT_QA_MAIL_FROM);
 const allow=(e.SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(e.SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED!=='1'||!admin||!from||!allow.includes(admin)||!allow.includes(user.toLowerCase()))return null;
 if(!e.SOURCEINDIA_CONTACT_QA_SMTP_HOST||!e.SOURCEINDIA_CONTACT_QA_SMTP_USER||!e.SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD)return null;
 return {admin,from,host:e.SOURCEINDIA_CONTACT_QA_SMTP_HOST,user:e.SOURCEINDIA_CONTACT_QA_SMTP_USER,pass:e.SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD};
}
async function sendQAMessages(conn:PoolConnection,fields:{fname:string;lname:string;email:string;subject:string;message:string},cfg:NonNullable<ReturnType<typeof qaMailConfiguration>>){
 const [templates]=await conn.execute<RowDataPacket[]>('SELECT email_id,subject,message FROM emails WHERE email_id IN (?,?)',[mailTemplateIds.admin,mailTemplateIds.user]);
 const admin=templates.find(t=>Number(t.email_id)===61),user=templates.find(t=>Number(t.email_id)===59);
 if(!admin||!user)throw Error('CONTACT_TEMPLATES_UNAVAILABLE');
 const port=Number(process.env.SOURCEINDIA_CONTACT_QA_SMTP_PORT??'587');
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('CONTACT_SMTP_PORT_INVALID');
 const {default:nodemailer}=await import('nodemailer');
 const mailer=nodemailer.createTransport({host:cfg.host,port,secure:port===465,auth:{user:cfg.user,pass:cfg.pass},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:10000});
 const expand=(source:unknown,replacements:Record<string,string>,fallback:string)=>{
  // Express uses fallback markup when a stored email template has no message.
  // Do not accidentally send the literal text 'null' or 'undefined'.
  const template=source===null||source===undefined||source===''?fallback:Buffer.isBuffer(source)?source.toString('utf8'):String(source);
  return template.replace(/{{\s*([A-Z_]+)\s*}}/g,(match,key:string)=>key in replacements?htmlEscape(replacements[key]):match);
 };
 try{
  await mailer.sendMail({from:{name:'SourceIndia QA Contact',address:cfg.from},to:cfg.admin,subject:String(admin.subject||`New Contact from ${fields.fname} ${fields.lname}`),html:expand(admin.message,{USER_FNAME:`${fields.fname} ${fields.lname}`,EMAIL:fields.email,SUBJECT:fields.subject,MESSAGE:fields.message},`<p>New message from ${htmlEscape(fields.fname)} ${htmlEscape(fields.lname)}</p>`)});
  await mailer.sendMail({from:{name:'SourceIndia QA Support',address:cfg.from},to:fields.email,subject:String(user.subject||'Thanks for contacting us!'),html:expand(user.message,{USER_FNAME:`${fields.fname} ${fields.lname}`},`<p>Hi ${htmlEscape(fields.fname)}, thank you for contacting us!</p>`)});
 }finally{mailer.close();}
}
export async function createContact(req:NextRequest):Promise<Response>{
 const denied=contactWriteGate(req);if(denied)return denied;
 const data=await parseBody(req);
 const fname=text(data?.fname,255),lname=text(data?.lname,255),userEmail=email(data?.email),subject=text(data?.subject,255),message=text(data?.message,12000);
 if(!fname||!lname||!userEmail||!subject||!message)return reply({success:false,message:'All fields are required.'},400);
 const cfg=qaMailConfiguration(userEmail);if(!cfg)return reply({message:'QA email configuration and recipient allowlist required.'},403);
 const db=localAccountDatabase();if(!db)return unavailable();
 const conn=await db.getConnection();let persisted=false;try{
  await conn.beginTransaction();
  const uuid=randomUUID();const [result]=await conn.execute<ResultSetHeader>('INSERT INTO contacts (uuid,fname,lname,email,subject,message,is_delete,created_at,updated_at) VALUES (?,?,?,?,?,?,0,NOW(),NOW())',[uuid,fname,lname,userEmail,subject,message]);
  const [rows]=await conn.execute<RowDataPacket[]>(`SELECT ${columns} FROM contacts WHERE contact_id=? LIMIT 1`,[result.insertId]);
  // Match the Express order: persist the contact first, then notify recipients.
  // Email delivery is external and cannot be rolled back with a MySQL transaction.
  await conn.commit();
  persisted=true;
  await sendQAMessages(conn,{fname,lname,email:userEmail,subject,message},cfg);
  return reply({success:true,message:'Your message has been sent successfully!',contact:rows[0]});
 }catch{
  if(!persisted){try{await conn.rollback();}catch{/* connection may have failed */}}
  // Preserve Express HTTP error status for mail failure; the already committed
  // contact must not be represented as rolled back.
  return reply({success:false,message:'Something went wrong. Please try again later.'},500);
 }finally{conn.release();}
}
async function transaction<T>(fn:(conn:PoolConnection)=>Promise<T>):Promise<T>{const db=localAccountDatabase();if(!db)throw Error('NO_DB');const conn=await db.getConnection();try{await conn.beginTransaction();const result=await fn(conn);await conn.commit();return result;}catch(e){await conn.rollback();throw e;}finally{conn.release();}}
export async function deleteContact(req:NextRequest,raw:string):Promise<Response>{
 const denied=contactWriteGate(req);if(denied)return denied;
 const id=idOf(raw);if(!id)return invalid();
 try{return await transaction(async conn=>{
  const [rows]=await conn.execute<RowDataPacket[]>('SELECT contact_id FROM contacts WHERE contact_id=? FOR UPDATE',[id]);
  if(!rows.length)return reply({message:'Contact not found'},404);
  await conn.execute('DELETE FROM contacts WHERE contact_id=?',[id]);return reply({message:'Contact deleted successfully'});
 });}catch{return unavailable();}
}
export async function deleteContactSelection(req:NextRequest):Promise<Response>{
 const denied=contactWriteGate(req);if(denied)return denied;
 const data=await parseBody(req),ids=data?.ids;
 if(!Array.isArray(ids)||!ids.length||ids.length>200)return reply({message:'Please provide an array of IDs to update.'},400);
 const unique=[...new Set(ids.map(idOf))];if(unique.some(x=>x===null))return invalid();
 try{return await transaction(async conn=>{
  const placeholders=unique.map(()=>' ? ').join(',');
  const [rows]=await conn.query<RowDataPacket[]>(`SELECT contact_id FROM contacts WHERE contact_id IN (${placeholders}) AND is_delete=0 FOR UPDATE`,unique);
  if(!rows.length)return reply({message:'No contacts found with the given IDs.'},404);
  await conn.query(`UPDATE contacts SET is_delete=1,updated_at=NOW() WHERE contact_id IN (${placeholders})`,unique);
  return reply({message:`${rows.length} contacts marked as deleted.`});
 });}catch{return unavailable();}
}
export async function updateContactDeleteStatus(req:NextRequest,raw:string):Promise<Response>{
 const denied=contactWriteGate(req);if(denied)return denied;
 const id=idOf(raw);if(!id)return invalid();const data=await parseBody(req);
 const value=data?.is_delete;if(value!==0&&value!==1)return reply({message:'Invalid delete status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await transaction(async conn=>{
  const [rows]=await conn.execute<RowDataPacket[]>('SELECT contact_id FROM contacts WHERE contact_id=? FOR UPDATE',[id]);
  if(!rows.length)return reply({message:'Contacts not found'},404);
  await conn.execute('UPDATE contacts SET is_delete=?,updated_at=NOW() WHERE contact_id=?',[value,id]);
  const [updated]=await conn.execute<RowDataPacket[]>(`SELECT ${columns} FROM contacts WHERE contact_id=?`,[id]);
  return reply({message:'Contacts is removed',contacts:updated[0]});
 });}catch{return unavailable();}
}
