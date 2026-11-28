/**
 * BULK122 — native MySQL ticket mutation handlers, isolated-QA only.
 * Replaces the ticket write bridge in nine original method/path registrations.
 * This module intentionally does NOT claim full original Express parity:
 * QA-only private attachment storage and paired email notifications are
 * implemented in BULK123; exact Express side-effect parity is unverified.
 * No production, non-local or non-QA DB may be written by these handlers.
 */
import type {NextRequest} from 'next/server';
import type {PoolConnection, ResultSetHeader, RowDataPacket} from 'mysql2/promise';
import {randomBytes, randomInt, randomUUID, timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {ticketAdminScope, type TicketScope} from '@/lib/localBulk121TicketAdmin';
import {parseTicketAttachment,persistTicketAttachment,removeTicketAttachment,managedTicketFileName,privateTicketAttachmentUrl,type TicketAttachment} from '@/lib/localBulk123TicketAttachments';

const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const answer=(body:unknown,status=200)=>Response.json(body,{status,headers});
const fail=(message:string,status:number)=>answer({message},status);
const qaFlag='SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED';
export type NativeTicketWrite='create'|'sendOtp'|'verifyOtp'|'store'|'track'|'reply'|'update'|'status'|'delete';
export const nativeTicketMethods:Readonly<Record<NativeTicketWrite,string>>={
 create:'POST /v2/api/tickets/',sendOtp:'POST /v2/api/tickets/send-otp',
 verifyOtp:'POST /v2/api/tickets/verify-otp',store:'POST /v2/api/tickets/store-ticket',
 track:'POST /v2/api/tickets/track-ticket',reply:'POST /v2/api/tickets/store-support-ticket-reply',
 update:'PUT /v2/api/tickets/:id',status:'PATCH /v2/api/tickets/:id/status',
 delete:'DELETE /v2/api/tickets/:id',
};
export function ticketQaGate(env:NodeJS.ProcessEnv=process.env):string|null{
 if(env.NODE_ENV==='production')return 'Ticket native writes disabled in production.';
 if(env[qaFlag]!=='1')return 'Ticket native writes disabled; isolated QA required.';
 const host=(env.DB_HOST||'').trim().toLowerCase();
 if(!['localhost','127.0.0.1','::1'].includes(host))return 'Ticket QA requires a local database host.';
 const name=(env.DB_NAME||'').trim();
 if(!name || name!==env.SOURCEINDIA_TICKET_QA_DB_NAME || !/(?:qa|test|sandbox)/i.test(name))
  return 'Ticket QA requires an explicitly named, isolated QA database.';
 return null;
}
const bounded=(value:unknown,max=4000,required=false)=>
 typeof value==='string'&&value.length<=max&&(!required||value.trim().length>0)&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)?value.trim():null;
const posId=(value:unknown)=>((typeof value==='string'||typeof value==='number')&&/^[1-9]\d{0,14}$/.test(String(value))&&Number.isSafeInteger(Number(value)))?Number(value):null;
const optId=(value:unknown)=>value===undefined||value===null||value===''?0:posId(value);
const email=(value:unknown)=>{
 const text=bounded(value,254,true)?.toLowerCase();
 return text&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)?text:null;
};
const tokenMatch=(a:unknown,b:unknown)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length<1||b.length<1||b.length>256)return false;
 const left=Buffer.from(a),right=Buffer.from(b);
 return left.length===right.length&&timingSafeEqual(left,right);
};
const ticketNumber=(value:unknown)=>typeof value==='string'&&/^SOURCE-INDIA-\d{8}-\d{3}$/.test(value)?value:null;
const freshTicketNumber=()=>`SOURCE-INDIA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomInt(100,1000)}`;
export function safeTicketHtml(value:string){return value.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch));}

/** Bound multipart parser: allow one private attachment and ordinary string fields. */
export async function readTicketBody(req:NextRequest):Promise<Record<string,unknown>|Response>{
 const length=Number(req.headers.get('content-length')||0);
 const type=(req.headers.get('content-type')||'').toLowerCase();
 const max=type.includes('multipart/form-data')?6*1024*1024:64*1024;
 if(!Number.isFinite(length)||length>max)return fail('Ticket request too large.',413);
 try{
  if(type.includes('application/json')){
   const value:unknown=await req.json();
   if(!value||Array.isArray(value)||typeof value!=='object'||Object.hasOwn(value,'__attachment'))return fail('Invalid request body.',400);
   return value as Record<string,unknown>;
  }
  if(type.includes('application/x-www-form-urlencoded')){
   const raw=await req.text();if(raw.length>max)return fail('Ticket request too large.',413);
   const params=new URLSearchParams(raw);const result:Record<string,unknown>={};
   for(const [key,val] of params){if(Object.hasOwn(result,key)||key==='__attachment')return fail('Duplicate or invalid form field.',400);result[key]=val;}
   return result;
  }
  if(type.includes('multipart/form-data')){
   const data=await req.formData();const result:Record<string,unknown>={};
   let total=0,seenAttachment=false;
   for(const [key,val] of data){
    if(Object.hasOwn(result,key)||key==='__attachment')return fail('Duplicate or invalid form field.',400);
    if(typeof val!=='string'){
     if(key!=='attachment'||seenAttachment)return fail('Unexpected or duplicate attachment.',400);
     seenAttachment=true;
     try{result.__attachment=await parseTicketAttachment(val as File);}catch(error){
      return fail(error instanceof Error&&error.message==='TICKET_ATTACHMENT_SIZE'?'Attachment too large.':'Invalid attachment.',
       error instanceof Error&&error.message==='TICKET_ATTACHMENT_SIZE'?413:400);
     }
     continue;
    }
    if(key==='attachment')return fail('Invalid attachment.',400);
    total+=val.length;if(total>64*1024)return fail('Ticket form fields too large.',413);
    result[key]=val;
   }
   return result;
  }
  return fail('Unsupported content type.',415);
 }catch{return fail('Invalid request body.',400);}
}
const getAttachment=(body:Record<string,unknown>)=>body.__attachment as TicketAttachment|undefined;
async function withAttachmentTransaction<T>(attachment:TicketAttachment|undefined,fn:(db:PoolConnection,name:string|null)=>Promise<T>):Promise<T>{
 let name:string|null=null;
 try{
  if(attachment)name=await persistTicketAttachment(attachment);
  return await withTransaction(conn=>fn(conn,name));
 }catch(error){if(name)try{await removeTicketAttachment(name);}catch{console.error('BULK123 QA attachment rollback cleanup failed.');}throw error;}
}
async function cleanupAttachments(names:(string|null|undefined)[]){
 for(const name of new Set(names.filter((x):x is string=>!!x))){
  if(!managedTicketFileName(name))throw Error('LEGACY_ATTACHMENT_REQUIRES_SEPARATE_QA');
  try{await removeTicketAttachment(name);}catch{console.error('BULK123 QA attachment post-commit cleanup failed.');}
 }
}

const qaMailConfig=()=>{
 const {SOURCEINDIA_TICKET_QA_SMTP_HOST:host,SOURCEINDIA_TICKET_QA_SMTP_USER:user,
 SOURCEINDIA_TICKET_QA_SMTP_PASSWORD:pass,SOURCEINDIA_TICKET_QA_MAIL_FROM:from,
 SOURCEINDIA_TICKET_QA_MAIL_ALLOWLIST:allow}=process.env;
 const recipients=(allow||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 return host&&user&&pass&&email(from)&&recipients.length?{host,user,pass,from:from!,recipients}:null;
};
async function sendQaMail(to:string,subject:string,html:string){
 const cfg=qaMailConfig();if(!cfg||!cfg.recipients.includes(to.toLowerCase()))throw Error('QA_MAIL_NOT_AUTHORIZED');
 const {default:nodemailer}=await import('nodemailer');
 const port=Number(process.env.SOURCEINDIA_TICKET_QA_SMTP_PORT||587);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('QA_MAIL_PORT_INVALID');
 const transporter=nodemailer.createTransport({host:cfg.host,port,secure:port===465,
  auth:{user:cfg.user,pass:cfg.pass},connectionTimeout:5000,greetingTimeout:5000,socketTimeout:10000});
 try{await transporter.sendMail({from:{name:'SourceIndia QA Support',address:cfg.from},to,subject,html});}
 finally{transporter.close();}
}
async function template(db:PoolConnection,id:number){
 const [rows]=await db.execute<RowDataPacket[]>('SELECT subject,message FROM emails WHERE email_id=? LIMIT 1',[id]);
 return rows[0] as (RowDataPacket&{subject:string;message:Buffer|string})|undefined;
}
const fillTemplate=(text:string,vars:Record<string,string>)=>text.replace(/{{\s*([A-Z_]+)\s*}}/g,(_,key:string)=>vars[key]===undefined?'':safeTicketHtml(vars[key]));
async function notifyTicket(db:PoolConnection,id:number,to:string,vars:Record<string,string>){
 if(process.env.SOURCEINDIA_TICKET_QA_NOTIFICATIONS_ENABLED!=='1')return false;
 const record=await template(db,id);if(!record)return false;
 const body=Buffer.isBuffer(record.message)?record.message.toString('utf8'):String(record.message);
 await sendQaMail(to,String(record.subject||'Support Ticket'),fillTemplate(body,vars));return true;
}
/** Original controller email template ID pairs, never sent without QA opt-in. */
export const ticketMailPairs={
 store:{user:110,admin:111},adminReply:{user:114,admin:115},
 guestReply:{user:113,admin:112},resolved:{user:117,admin:116},
 cancelled:{user:118,admin:119},
} as const;
export type TicketMailEvent=keyof typeof ticketMailPairs;
async function qaSiteEmail(db:PoolConnection):Promise<string|null>{
 // Use the original site setting only when independently allowlisted.
 const override=email(process.env.SOURCEINDIA_TICKET_QA_ADMIN_EMAIL);
 const selected=override||await (async()=>{
  const [rows]=await db.execute<RowDataPacket[]>("SELECT meta_value FROM site_settings WHERE meta_key='site_email' LIMIT 1");
  return email(String(rows[0]?.meta_value||''));
 })();
 const cfg=qaMailConfig();return selected&&cfg?.recipients.includes(selected)?selected:null;
}
async function sendTicketPair(event:TicketMailEvent,userEmail:string,vars:Record<string,string>){
 if(process.env.SOURCEINDIA_TICKET_QA_NOTIFICATIONS_ENABLED!=='1'||ticketQaGate())return;
 const pool=localAccountDatabase();if(!pool)return;
 const conn=await pool.getConnection();
 try{
  const pair=ticketMailPairs[event],siteEmail=await qaSiteEmail(conn);
  const cfg=qaMailConfig();
  const recipients=[{template:pair.user,to:email(userEmail)},{template:pair.admin,to:siteEmail}];
  for(const target of recipients){
   if(!target.to||!cfg?.recipients.includes(target.to))continue;
   try{await notifyTicket(conn,target.template,target.to,vars);}
   catch{console.warn('BULK123 QA ticket notification skipped after send error.');}
  }
 }finally{conn.release();}
}
async function withTransaction<T>(fn:(db:PoolConnection)=>Promise<T>){
 const pool=localAccountDatabase();if(!pool)throw Error('QA_DB_UNAVAILABLE');
 const connection=await pool.getConnection();
 try{await connection.beginTransaction();const result=await fn(connection);await connection.commit();return result;}
 catch(err){await connection.rollback();throw err;}finally{connection.release();}
}
class TicketAbort{constructor(readonly response:Response){}}
function abort(message:string,status:number):never{throw new TicketAbort(fail(message,status));}
function fields(body:Record<string,unknown>,keys:readonly string[]){return keys.every(k=>!Object.hasOwn(body,k)||typeof body[k]==='string'||typeof body[k]==='number');}
const dateAgeSql='TIMESTAMPDIFF(SECOND,updated_at,NOW()) AS age_seconds';

async function requireAdmin(req:NextRequest):Promise<TicketScope|Response>{
 const result=await ticketAdminScope(req);return 'error' in result?result.error:result.scope;
}
const isScope=(value:TicketScope|Response):value is TicketScope=>!(value instanceof Response);
async function scopedTicket(db:PoolConnection,id:number,scope:TicketScope){
 const [rows]=await db.execute<RowDataPacket[]>(`SELECT tickets_id AS id,category,ticket_id,title,email,attachment,
 status,is_complete,priority,token FROM tickets WHERE tickets_id=?${scope.all?'':' AND category=?'} FOR UPDATE`,
  scope.all?[id]:[id,scope.category]);
 return rows[0];
}
const ageValid=(row:RowDataPacket,seconds:number)=>Number(row.age_seconds)>=0&&Number(row.age_seconds)<=seconds;

export async function nativeTicketWrite(req:NextRequest,operation:NativeTicketWrite,rawId?:string):Promise<Response>{
 const denial=ticketQaGate();if(denial)return fail(denial,403);
 // Reject cross-origin browser writes even on an opt-in QA database. Local
 // automated QA clients can omit Origin, but mismatched browser Origin fails.
 const origin=req.headers.get('origin');
 if((origin&&origin!==new URL(req.url).origin)||req.headers.get('sec-fetch-site')==='cross-site')
  return fail('Cross-origin ticket mutations are not allowed.',403);
 const [method]=nativeTicketMethods[operation].split(' ');
 if(req.method!==method)return fail('Method not allowed.',405);
 const db=localAccountDatabase();if(!db)return fail('Local QA database not configured.',503);
 const adminOnly=['create','update','status','delete'].includes(operation);
 const scope=adminOnly?await requireAdmin(req):null;
 if(scope instanceof Response)return scope;
 const id=['update','status','delete'].includes(operation)?posId(rawId):null;
 if(['update','status','delete'].includes(operation)&&id===null)return fail('Invalid ticket identifier.',400);
 const body=operation==='delete'?{}:await readTicketBody(req);
 if(body instanceof Response)return body;
 if(!fields(body,['id','user_id','ticket_id','email','otp','title','message','status','category','priority']))
  return fail('Invalid ticket fields.',400);
 try{
  switch(operation){
   case 'create':{
    const userId=posId(body.user_id),title=bounded(body.title,1000,true),message=bounded(body.message,20000,true);
    const priority=bounded(body.priority,50,true),category=bounded(body.category,50,true),status=Number(body.status??0);
    if(!userId||!title||!message||!priority||!category||!Number.isInteger(status)||status<0||status>3)
     return fail('Invalid ticket fields.',400);
    if(isScope(scope!)&&!scope.all&&String(scope.category)!==category)return fail('Ticket category access denied.',403);
    const result=await withAttachmentTransaction(getAttachment(body),async (conn,attachment)=>{
     const [users]=await conn.execute<RowDataPacket[]>('SELECT fname,lname,email,mobile FROM users WHERE user_id=? AND is_delete=0 LIMIT 1',[userId]);
     if(!users.length)abort('User not found',404);
     const owner=users[0],number=freshTicketNumber(),token=randomBytes(24).toString('hex');
     const [insert]=await conn.execute<ResultSetHeader>(`INSERT INTO tickets
      (uuid,user_id,ticket_id,title,message,priority,category,status,attachment,fname,lname,email,phone,added_by,created_by,token,is_complete,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
      [randomUUID(),userId,number,title,message,priority,category,status,attachment,owner.fname,owner.lname,owner.email,owner.mobile,'admin','Admin',token]);
     await conn.execute(`INSERT INTO ticket_replies (uuid,user_id,ticket_id,reply,added_by,attachment,media_type,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,[randomUUID(),userId,insert.insertId,message,'Admin',attachment,getAttachment(body)?.mediaType||'text']);
     const [tickets]=await conn.execute<RowDataPacket[]>('SELECT tickets_id AS id,uuid,user_id,ticket_id,title,message,priority,category,status,attachment,fname,lname,email,phone,added_by,created_by,token,is_complete,created_at,updated_at FROM tickets WHERE tickets_id=?',[insert.insertId]);
     return {ticket:tickets[0],number,token};
    });
    return answer({success:true,message:'Ticket created successfully',ticket:result.ticket,ticket_id:result.number,token:result.token},201);
   }
   case 'sendOtp':{
    const to=email(body.email),userId=optId(body.user_id),createdBy=bounded(body.created_by??'Guest',100);
    if(!to)return fail('Email is required',400);
    if(userId===null||createdBy===null)return fail('Invalid ticket fields.',400);
    if(!qaMailConfig()?.recipients.includes(to))return fail('Isolated QA email delivery is not configured for this recipient.',503);
    const result=await withTransaction(async conn=>{
     const [current]=await conn.execute<RowDataPacket[]>(`SELECT tickets_id AS id,${dateAgeSql} FROM tickets
       WHERE email=? AND is_complete=0 ORDER BY tickets_id DESC LIMIT 1 FOR UPDATE`,[to]);
     if(current.length&&Number(current[0].age_seconds)>=0&&Number(current[0].age_seconds)<60)
      abort('Please wait before requesting another OTP.',429);
     const otp=randomInt(1000,10000),marker='B122OTP:'+randomBytes(12).toString('hex')+':0';
     let ticketId:number;
     if(current.length){ticketId=Number(current[0].id);
      await conn.execute(`UPDATE tickets SET otp=?,token=?,added_by='front',user_id=?,created_by=?,updated_at=NOW() WHERE tickets_id=?`,
       [otp,marker,userId,createdBy,ticketId]);
     }else{
      const [insert]=await conn.execute<ResultSetHeader>(`INSERT INTO tickets
       (uuid,email,otp,token,added_by,user_id,created_by,is_complete,created_at,updated_at)
       VALUES (?,?,?,?,'front',?,?,0,NOW(),NOW())`,[randomUUID(),to,otp,marker,userId,createdBy]);
      ticketId=insert.insertId;
     }
     const mail=await template(conn,87);if(!mail)abort('Email template not found',404);
     const html=fillTemplate(Buffer.isBuffer(mail.message)?mail.message.toString('utf8'):String(mail.message),
       {OTP:String(otp),USER_FNAME:'Guest'});
     // Only an allowlisted QA recipient is contacted. Email must succeed before DB commit.
     await sendQaMail(to,String(mail.subject||'Your OTP Code'),html);
     return ticketId;
    });
    return answer({success:1,message:'OTP sent successfully',ticket_id:result,email:to});
   }
   case 'verifyOtp':{
    const to=email(body.email),otp=typeof body.otp==='string'&&/^\d{4}$/.test(body.otp)?Number(body.otp):
     typeof body.otp==='number'&&Number.isInteger(body.otp)&&body.otp>=1000&&body.otp<=9999?body.otp:null;
    if(!to||otp===null)return fail('Email and OTP are required',400);
    const result=await withTransaction(async conn=>{
     const [rows]=await conn.execute<RowDataPacket[]>(`SELECT tickets_id AS id,otp,token,${dateAgeSql}
      FROM tickets WHERE email=? AND is_complete=0 ORDER BY tickets_id DESC LIMIT 1 FOR UPDATE`,[to]);
     if(!rows.length)abort('Ticket not found',404);
     const row=rows[0];
     const match=typeof row.token==='string'?/^B122OTP:([a-f0-9]{24}):([0-5])$/.exec(row.token):null;
     if(!match||!ageValid(row,600)||Number(match[2])>=5)abort('Invalid OTP',400);
     if(Number(row.otp)!==otp){
      // Failed attempt must COMMIT, not rollback; limited to five per issued OTP.
      await conn.execute('UPDATE tickets SET token=? WHERE tickets_id=?',
       [`B122OTP:${match[1]}:${Number(match[2])+1}`,row.id]);
      return {ok:false,id:0};
     }
     await conn.execute(`UPDATE tickets SET otp=NULL,token=?,updated_at=NOW() WHERE tickets_id=?`,
      ['B122VERIFIED:'+randomBytes(16).toString('hex'),row.id]);
     return {ok:true,id:Number(row.id)};
    });
    if(!result.ok)return fail('Invalid OTP',400);
    return answer({success:2,message:'OTP verified successfully',ticket_id:result.id,email:to});
   }
   case 'store':{
    const to=email(body.email),pending=posId(body.ticket_id),first=bounded(body.first_name,150,true),
     last=bounded(body.last_name??'',150),phone=bounded(body.phone??'',40),title=bounded(body.title,1000,true),
     message=bounded(body.message,20000,true),addedBy=bounded(body.added_by??'Guest',100),userId=optId(body.user_id);
    if(!to||!pending||!first||last===null||phone===null||!title||!message||!addedBy||userId===null)
     return fail('Invalid ticket fields.',400);
    // The public client must not claim ownership of other users' accounts.
    if(userId!==0)return fail('Authenticated account association requires separate QA.',403);
    const result=await withAttachmentTransaction(getAttachment(body),async (conn,attachment)=>{
     const [rows]=await conn.execute<RowDataPacket[]>(`SELECT tickets_id AS id,email,token,${dateAgeSql} FROM tickets
      WHERE tickets_id=? AND is_complete=0 FOR UPDATE`,[pending]);
     if(!rows.length||String(rows[0].email).toLowerCase()!==to||
      typeof rows[0].token!=='string'||!rows[0].token.startsWith('B122VERIFIED:')||!ageValid(rows[0],1800))
      abort('Email not verified',403);
     const number=freshTicketNumber(),token=randomBytes(24).toString('hex');
     await conn.execute(`UPDATE tickets SET fname=?,lname=?,phone=?,title=?,message=?,ticket_id=?,attachment=?,
      status=0,priority='high',category='1',is_complete=1,created_by=?,token=?,updated_at=NOW() WHERE tickets_id=?`,
      [first,last,phone,title,message,number,attachment,addedBy,token,pending]);
     await conn.execute(`INSERT INTO ticket_replies (uuid,user_id,ticket_id,reply,added_by,attachment,media_type,created_at,updated_at)
      VALUES (?,0,?,?,?,?,?,NOW(),NOW())`,[randomUUID(),pending,message,addedBy,attachment,getAttachment(body)?.mediaType||'file']);
     return {number,token};
    });
    await sendTicketPair('store',to,{USER_NAME:`${first} ${last}`,USER_EMAIL:to,
     TICKET_ID:result.number,TICKET_SUBJECT:title,TICKET_MESSAGE:message,DATE_TIME:new Date().toLocaleString()})
     .catch(()=>console.warn('BULK123 QA create notification unavailable.'));
    return answer({success:true,message:'Ticket created successfully',ticket_id:result.number,token:result.token});
   }
   case 'track':{
    const to=email(body.email),number=ticketNumber(body.ticketId);
    if(!to||!number)return fail('Please enter valid credentials.',403);
    const [rows]=await db.execute<RowDataPacket[]>(`SELECT ticket_id,token,email FROM tickets WHERE ticket_id=? AND LOWER(email)=? AND is_complete=1 LIMIT 1`,[number,to]);
    if(!rows.length||!tokenMatch(String(rows[0].email).toLowerCase(),to))return fail('Please enter valid credentials.',403);
    return answer({success:true,message:'Ticket successfully',ticket_id:number,token:rows[0].token});
   }
   case 'reply':{
    const number=ticketNumber(body.id),message=bounded(body.message,20000,true),type=bounded(body.type??'reply',50),
     tracker=bounded(body.token,256),adminSession=await requireAdmin(req);
    const admin=isScope(adminSession);
    if(!number||!message||!type)return fail('Ticket ID and message are required',400);
    if(!admin&&!tracker)return fail('Ticket authentication required.',401);
    const result=await withAttachmentTransaction(getAttachment(body),async (conn,attachment)=>{
     const [rows]=await conn.execute<RowDataPacket[]>(`SELECT tickets_id AS id,ticket_id,token,fname,lname,email,status,category
      FROM tickets WHERE ticket_id=? AND is_complete=1 FOR UPDATE`,[number]);
     if(!rows.length)abort('Ticket not found',404);
     const row=rows[0];
     if(admin){if(!adminSession.all&&Number(row.category)!==adminSession.category)abort('Ticket category access denied.',403);}
     else if(!tokenMatch(row.token,tracker))abort('Ticket authentication required.',401);
     const addedBy=admin?'Admin':'Guest';
     await conn.execute(`INSERT INTO ticket_replies (uuid,user_id,ticket_id,reply,added_by,attachment,media_type,created_at,updated_at)
      VALUES (?,0,?,?,?,?,?,NOW(),NOW())`,[randomUUID(),row.id,message,addedBy,attachment,type]);
     if(Number(row.status)===0)await conn.execute(`UPDATE tickets SET status=1,updated_at=NOW() WHERE tickets_id=?`,[row.id]);
     return {addedBy,email:String(row.email||''),name:`${row.fname||''} ${row.lname||''}`.trim(),id:Number(row.id),attachment};
    });
    await sendTicketPair(result.addedBy==='Admin'?'adminReply':'guestReply',result.email,
     {USER_NAME:result.name,USER_EMAIL:result.email,TICKET_ID:number,
      SUPPORT_REPLY:message,USER_REPLY:message,DATE_TIME:new Date().toLocaleString()})
     .catch(()=>console.warn('BULK123 QA reply notification unavailable.'));
    const attachmentUrl=result.attachment?privateTicketAttachmentUrl(result.id,result.attachment):'';
    const view=`<div><h6>${safeTicketHtml(result.addedBy)}</h6><span>${safeTicketHtml(new Date().toLocaleString())}</span><p>${safeTicketHtml(message)}</p>${attachmentUrl?'<a href=\"'+attachmentUrl+'\">View Attachment</a>':''}</div>`;
    return answer({success:1,view,message:'Support ticket reply sent successfully.'});
   }
   case 'update':{
    const userId=posId(body.user_id),title=bounded(body.title,1000,true),message=bounded(body.message,20000,true),
     priority=bounded(body.priority,50,true),category=bounded(body.category,50,true),status=Number(body.status);
    if(!userId||!title||!message||!priority||!category||!Number.isInteger(status)||status<0||status>3)
     return fail('Invalid ticket fields.',400);
    if(isScope(scope!)&&!scope.all&&String(scope.category)!==category)return fail('Ticket category access denied.',403);
    const result=await withAttachmentTransaction(getAttachment(body),async (conn,attachment)=>{
     const row=await scopedTicket(conn,id!,scope as TicketScope);if(!row)abort('Ticket not found',404);
     if(row.attachment&&attachment&&!managedTicketFileName(row.attachment))abort('Legacy attachment replacement requires separate QA.',501);
     await conn.execute(`UPDATE tickets SET user_id=?,title=?,message=?,priority=?,category=?,status=?,attachment=?,updated_at=NOW() WHERE tickets_id=?`,
      [userId,title,message,priority,category,status,attachment||row.attachment||null,id]);
     const [rows]=await conn.execute<RowDataPacket[]>('SELECT tickets_id AS id,user_id,title,message,priority,category,status,updated_at FROM tickets WHERE tickets_id=?',[id]);
     return {ticket:rows[0],replaced:attachment?String(row.attachment||''):''};
    });
    if(result.replaced){
     // First reply can still reference the prior attachment after a ticket edit.
     const [references]=await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM ticket_replies WHERE attachment=?',[result.replaced]);
     if(Number(references[0]?.total||0)===0)await cleanupAttachments([result.replaced]);
    }
    return answer({message:'Ticket updated',tickets:result.ticket});
   }
   case 'status':{
    const status=Number(body.status);
    if(!Number.isInteger(status)||![2,3].includes(status))return fail('Invalid status value',400);
    const result=await withTransaction(async conn=>{
     const row=await scopedTicket(conn,id!,scope as TicketScope);if(!row)abort('Ticket not found',404);
     await conn.execute(`UPDATE tickets SET status=?,is_complete=CASE WHEN ?=2 THEN 1 ELSE is_complete END,updated_at=NOW()
      WHERE tickets_id=?`,[status,status,id]);
     const [rows]=await conn.execute<RowDataPacket[]>(`SELECT tickets_id AS id,ticket_id,title,email,fname,lname,status,is_complete,created_at,updated_at FROM tickets WHERE tickets_id=?`,[id]);
     return rows[0];
    });
    await sendTicketPair(status===2?'resolved':'cancelled',String(result.email||''),
     {USER_NAME:String(result.fname||'')+' '+String(result.lname||''),USER_EMAIL:String(result.email||''),
      TICKET_ID:String(result.ticket_id||''),TICKET_SUBJECT:String(result.title||''),DATE_TIME:new Date().toLocaleString()})
     .catch(()=>console.warn('BULK123 QA status notification unavailable.'));
    const {email:ignored,...safe}=result;void ignored;
    return answer({message:'Ticket status updated successfully',ticket:safe});
   }
   case 'delete':{
    const result=await withTransaction(async conn=>{
     const row=await scopedTicket(conn,id!,scope as TicketScope);if(!row)abort('Ticket not found',404);
     const [replyFiles]=await conn.execute<RowDataPacket[]>('SELECT attachment FROM ticket_replies WHERE ticket_id=? AND attachment IS NOT NULL FOR UPDATE',[id]);
     const attachments=[row.attachment,...replyFiles.map(x=>x.attachment)].filter(Boolean) as string[];
     if(attachments.some(name=>!managedTicketFileName(name)))abort('Legacy attachment cleanup requires separate QA.',501);
     await conn.execute('DELETE FROM ticket_replies WHERE ticket_id=?',[id]);
     await conn.execute('DELETE FROM tickets WHERE tickets_id=?',[id]);
     return attachments;
    });
    await cleanupAttachments(result);
    return answer({message:'Ticket deleted successfully'});
   }
  }
 }catch(error){
  if(error instanceof TicketAbort)return error.response;
  console.error('BULK122 native ticket operation unavailable',operation,error instanceof Error?error.name:'unknown');
  return fail('Native ticket operation unavailable in isolated QA.',503);
 }
}
