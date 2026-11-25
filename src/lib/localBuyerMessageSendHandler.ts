import type {ResultSetHeader,RowDataPacket} from 'mysql2';
import nodemailer from 'nodemailer';
import {context,recipient} from '@/lib/localBuyerMessagePreviewHandler';
import {assessMailReadiness,mailSettingsSql,type MailSetting} from '@/lib/localBuyerMessageDeliveryReadiness';
import {buyerMessageExistingSql,buyerMessageInsertSql,buyerTemplateRender,deduplicationUuid,parseBuyerMessageSend} from '@/lib/localBuyerMessageSend';

const headers={'Cache-Control':'private, no-store',Vary:'Authorization'};
const error=(status:number,message:string)=>Response.json({message},{status,headers});
type SettingRow=RowDataPacket & MailSetting;
type TemplateRow=RowDataPacket & {subject:string|null;message:Buffer|string;message_bytes:number};
type ExistingRow=RowDataPacket & {id:number;user_id:number;reciever_id:number;title:string;message:string;receiver_company_id:number|null};
type SenderRow=RowDataPacket & {organization_name:string|null};
type ReceiverRow=RowDataPacket & {fname:string|null;lname:string|null;email:string|null};
const templateSql=`SELECT subject,message,OCTET_LENGTH(message) AS message_bytes FROM emails WHERE email_id=67 AND status=1 LIMIT 1`;
const receiverSql=`SELECT fname,lname,email FROM users WHERE user_id=? AND status=1 AND is_delete=0 LIMIT 1`;
const senderSql=`SELECT organization_name FROM company_info WHERE company_id=? LIMIT 1`;

export async function sendBuyerMessage(request:Request):Promise<Response> {
  if ([...new URL(request.url).searchParams.keys()].some(k=>!k.startsWith('utm_'))) return error(400,'Unknown query parameter.');
  if (!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json')) return error(415,'JSON required.');
  if (Number(request.headers.get('content-length')??0)>8192) return error(413,'Request too large.');
  const ctx=await context(request);
  if (ctx.error) return ctx.error;
  let raw:string;
  try {raw=await request.text();} catch {return error(400,'Invalid request body.');}
  if(Buffer.byteLength(raw,'utf8')>8192)return error(413,'Request too large.');
  let obj:unknown;
  try {obj=JSON.parse(raw);} catch{return error(400,'Invalid JSON.');}
  const input=parseBuyerMessageSend(obj);
  if(!input)return error(400,'Invalid company, title, message or request_id.');
  const db=ctx.db!,sender=ctx.account!;
  const secret=process.env.LOCAL_AUTH_JWT_SECRET;
  if(!secret)return error(503,'Local messaging API not configured.');
  if(process.env.LOCAL_BUYER_MESSAGE_SEND_ENABLED!=='true') return error(503,'Buyer message sending not enabled. No message saved.');
  const uuid=deduplicationUuid(sender.id,input.requestId,secret);
  try {
    const [existing]=await db.execute<ExistingRow[]>(buyerMessageExistingSql,[uuid]);
    if(existing.length){
      const row=existing[0];
      if(row.user_id!==sender.id || row.receiver_company_id!==input.companyId || row.title!==input.title || row.message!==input.message)
        return error(409,'Request ID already used for a different message.');
      // Do not send twice; prior request may have partially delivered.
      return Response.json({id:row.id,saved:true,already_exists:true,
        delivery_status:'not_retried',note:'Request already recorded; email has not been sent again.'},{status:200,headers});
    }
    const destination=await recipient(db,input.companyId);
    if(!destination)return error(404,'Seller company not found.');
    if(destination.receiver_id===sender.id || sender.company_id===input.companyId)return error(403,'Cannot message your own company.');
    const [[settings],[templates],[receivers]] = await Promise.all([
      db.execute<SettingRow[]>(mailSettingsSql),
      db.execute<TemplateRow[]>(templateSql),
      db.execute<ReceiverRow[]>(receiverSql,[destination.receiver_id]),
    ]);
    const template=templates[0];
    const state=assessMailReadiness(settings,template?{email_id:67,subject:template.subject,message_bytes:template.message_bytes}:null);
    const receiver=receivers[0];
    if(!template || !state.ready_for_transport_integration || !receiver?.email || !sender.company_id)
      return error(503,'Email delivery prerequisites not configured. No message saved.');
    const smtp=Object.fromEntries(settings.map(s=>[s.meta_key,s.meta_value??'']));
    const port=Number(smtp.smtp_port);
    if(!smtp.smtp_from_address || !/^\S+@\S+\.\S+$/.test(smtp.smtp_from_address))
      return error(503,'SMTP from address not configured. No message saved.');
    const [companies]=await db.execute<SenderRow[]>(senderSql,[sender.company_id]);
    const senderName=companies[0]?.organization_name??'';
    const receiverName=[receiver.fname,receiver.lname].filter(Boolean).join(' ');
    const html=buyerTemplateRender(Buffer.isBuffer(template.message)?template.message.toString('utf8'):String(template.message),receiverName,senderName,input.title,input.message);
    // SMTP is configured and template is available before the first write.
    let id:number;
    try{
      const [insert]=await db.execute<ResultSetHeader>(buyerMessageInsertSql,[uuid,sender.id,destination.receiver_id,input.title,input.message]);
      id=insert.insertId;
    }catch(e){
      // Concurrent duplicate request. Unique(uuid) enforces single record.
      if((e as {code?:string}).code==='ER_DUP_ENTRY')return Response.json({saved:true,already_exists:true,delivery_status:'not_retried'}, {status:200,headers});
      throw e;
    }
    try {
      const transport=nodemailer.createTransport({host:smtp.smtp_server_address,port,
        secure:port===465,requireTLS:port!==465,
        auth:{user:smtp.smtp_username,pass:smtp.smtp_password},
        tls:{rejectUnauthorized:true},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
      try {
        await transport.sendMail({from:{name:smtp.smtp_from_name||'SourceIndia',address:smtp.smtp_from_address},
          to:receiver.email,subject:template.subject||'New message',html});
      } finally { transport.close(); }
      return Response.json({id,saved:true,delivery_status:'sent'},{status:201,headers});
    }catch {
      // Email and database cannot be made atomic without an outbox table.
      return Response.json({id,saved:true,delivery_status:'failed',
        message:'Message saved but email delivery failed. Do not retry with another request_id.'},{status:202,headers});
    }
  }catch {return error(503,'Local buyer messaging temporarily unavailable.');}
}
