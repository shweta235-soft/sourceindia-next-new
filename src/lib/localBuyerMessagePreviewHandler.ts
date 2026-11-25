import type { RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { buyerRecipientSql, parseBuyerMessagePreview, validRecipientCompanyId } from '@/lib/localBuyerMessagePreview';

const headers = {'Cache-Control':'private, no-store',Vary:'Authorization'};
const fail = (status:number,message:string) => Response.json({message},{status,headers});
type RecipientRow = RowDataPacket & {receiver_id:number;company_id:number;organization_name:string|null;organization_slug:string|null};
export async function context(request:Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return {error:fail(503,'Local messaging API is not configured.')};
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  const claims = bearer && verifyLocalAuthToken(bearer.replace(/^Bearer /i,''),secret);
  if (!claims) return {error:fail(401,'Please sign in again.')};
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return {error:fail(401,'Please sign in again.')};
    return {db,account};
  } catch {return {error:fail(503,'Local user data temporarily unavailable.')};}
}
export async function recipient(db:NonNullable<ReturnType<typeof localAccountDatabase>>,companyId:number) {
  const [rows] = await db.execute<RecipientRow[]>(buyerRecipientSql,[companyId]);
  return rows[0] ?? null;
}
export async function buyerMessageRecipient(request:Request,rawId:string):Promise<Response> {
  const id = validRecipientCompanyId(rawId);
  if (!id) return fail(400,'Invalid company ID.');
  if ([...new URL(request.url).searchParams.keys()].some(k=>!k.startsWith('utm_'))) return fail(400,'Unknown query parameter.');
  const ctx = await context(request);
  if (ctx.error) return ctx.error;
  try {
    const destination = await recipient(ctx.db!,id);
    if (!destination) return fail(404,'Seller company not found.');
    if (destination.receiver_id === ctx.account!.id || ctx.account!.company_id === id)
      return fail(403,'Cannot message your own company.');
    return Response.json({company_id:id,organization_name:destination.organization_name,
      organization_slug:destination.organization_slug,can_message:true},{headers});
  } catch {return fail(503,'Recipient lookup temporarily unavailable.');}
}
export async function validateBuyerMessage(request:Request):Promise<Response> {
  if ([...new URL(request.url).searchParams.keys()].some(k=>!k.startsWith('utm_'))) return fail(400,'Unknown query parameter.');
  if (!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json')) return fail(415,'JSON required.');
  if (Number(request.headers.get('content-length')??0)>8192) return fail(413,'Request too large.');
  const ctx = await context(request);
  if (ctx.error) return ctx.error;
  let parsed:unknown;
  try {
    const raw=await request.text();
    if (Buffer.byteLength(raw,'utf8')>8192) return fail(413,'Request too large.');
    parsed=JSON.parse(raw);
  } catch {return fail(400,'Invalid JSON.');}
  const message=parseBuyerMessagePreview(parsed);
  if (!message) return fail(400,'Invalid company, title or message.');
  try {
    const destination=await recipient(ctx.db!,message.companyId);
    if (!destination) return fail(404,'Seller company not found.');
    if (destination.receiver_id===ctx.account!.id || ctx.account!.company_id===message.companyId)
      return fail(403,'Cannot message your own company.');
    return Response.json({valid:true,company_id:message.companyId,
      organization_name:destination.organization_name,
      title_length:message.title.length,message_length:message.message.length,
      note:'Validation only: no message saved or email sent.'},{headers});
  } catch {return fail(503,'Recipient lookup temporarily unavailable.');}
}
