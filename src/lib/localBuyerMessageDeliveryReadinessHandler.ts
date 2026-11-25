import type { RowDataPacket } from 'mysql2';
import { context, recipient } from '@/lib/localBuyerMessagePreviewHandler';
import { parseBuyerMessagePreview } from '@/lib/localBuyerMessagePreview';
import { mailSettingsSql, template67Sql, assessMailReadiness, type MailSetting, type MailTemplate } from '@/lib/localBuyerMessageDeliveryReadiness';
const headers={'Cache-Control':'private, no-store', Vary:'Authorization'};
const error=(status:number,message:string)=>Response.json({message},{status,headers});
type SettingRow=RowDataPacket & MailSetting;
type TemplateRow=RowDataPacket & MailTemplate;
async function readiness(db:NonNullable<Awaited<ReturnType<typeof context>>['db']>) {
  const [settings]=await db.execute<SettingRow[]>(mailSettingsSql);
  const [templates]=await db.execute<TemplateRow[]>(template67Sql);
  return assessMailReadiness(settings,templates[0]??null);
}
function validQuery(request:Request) {
  return [...new URL(request.url).searchParams.keys()].every(k=>k.startsWith('utm_'));
}
export async function buyerMessageDeliveryReadiness(request:Request):Promise<Response> {
  if (!validQuery(request)) return error(400,'Unknown query parameter.');
  const ctx=await context(request);
  if (ctx.error) return ctx.error;
  try { return Response.json(await readiness(ctx.db!),{headers}); }
  catch {return error(503,'Mail configuration lookup temporarily unavailable.');}
}
export async function prepareBuyerMessage(request:Request):Promise<Response> {
  if (!validQuery(request)) return error(400,'Unknown query parameter.');
  if (!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json'))
    return error(415,'JSON required.');
  if (Number(request.headers.get('content-length')??0)>8192) return error(413,'Request too large.');
  const ctx=await context(request);
  if (ctx.error) return ctx.error;
  let raw:string;
  try {raw=await request.text();} catch {return error(400,'Invalid request body.');}
  if (Buffer.byteLength(raw,'utf8')>8192) return error(413,'Request too large.');
  let value:unknown;
  try {value=JSON.parse(raw);} catch {return error(400,'Invalid JSON.');}
  const input=parseBuyerMessagePreview(value);
  if (!input) return error(400,'Invalid company, title or message.');
  try {
    const destination=await recipient(ctx.db!,input.companyId);
    if (!destination) return error(404,'Seller company not found.');
    if (destination.receiver_id===ctx.account!.id || ctx.account!.company_id===input.companyId)
      return error(403,'Cannot message your own company.');
    const mail=await readiness(ctx.db!);
    return Response.json({valid:true,company_id:input.companyId,
      title_length:input.title.length,message_length:input.message.length,
      ...mail,note:'Read-only preflight. No message stored or email sent.'},{headers});
  } catch {return error(503,'Buyer message preflight temporarily unavailable.');}
}
