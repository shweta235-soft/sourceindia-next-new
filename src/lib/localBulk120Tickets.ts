/** BULK120: Native, read-only ticket endpoints. Sensitive ticket contents and
 * tracking tokens are never exposed without access control. Unlike the
 * original Express GET /tickets, public listing/detail are intentionally
 * restricted (documented security divergence; NOT claimed 1:1 parity).
 */
import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminSessionCookie,readAdminSession} from '@/lib/adminSession';
import {timingSafeEqual} from 'node:crypto';
import {ticketAdminScope,ticketAdminGrid,type TicketScope} from '@/lib/localBulk121TicketAdmin';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const unavailable=()=>json({message:'Local database not configured.'},503);
const failure=()=>json({message:'Local ticket lookup unavailable.'},503);
const bad=()=>json({message:'Invalid ticket identifier or query.'},400);
const denied=()=>json({message:'Unauthorized'},401);
const validId=(raw:string)=>/^[1-9]\d{0,14}$/.test(raw)&&Number.isSafeInteger(+raw)?+raw:null;
const safeTicket=(raw:string)=>raw.length>0&&raw.length<=160&&!/[\x00-\x1f]/.test(raw);
const auth=(request:NextRequest)=>Boolean(readAdminSession(request.cookies.get(adminSessionCookie)?.value));
const dateSql=(name:string)=>`CASE WHEN ${name} IS NULL OR YEAR(${name})=0 OR MONTH(${name})=0 OR DAYOFMONTH(${name})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(${name}, '%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END`;
// The original Tickets Sequelize model includes these columns; never query otp or token
// except for a validated tracker token, and do not return their values to clients.
const safeCols=`t.tickets_id AS id,t.uuid,t.fname,t.lname,t.phone,t.email,t.cc_email,t.ticket_id,t.user_id,t.title,t.attachment,t.message,t.status,t.is_complete,t.priority,t.category,t.created_by,t.added_by,${dateSql('t.created_at')} AS created_at,${dateSql('t.updated_at')} AS updated_at`;
const fullCols=`${safeCols},t.otp,t.token`;
const status=(value:unknown)=>Number(value)===0?'Pending':Number(value)===1?'In Progress':Number(value)===2?'Resolved':Number(value)===3?'Cancel':'';
const dbOrNull=()=>localAccountDatabase();
const stripSecrets=(row:RowDataPacket)=>{const {otp,token,...rest}=row;return rest;};
const tokenEqual=(actual:unknown,provided:string)=>{
 if(typeof actual!=='string'||!actual||!provided||provided.length>512)return false;
 const a=Buffer.from(actual,'utf8'),b=Buffer.from(provided,'utf8');
 return a.length===b.length&&timingSafeEqual(a,b);
};
export async function countTickets(){const db=dbOrNull();if(!db)return unavailable();try{const [rows]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM tickets');return json({total:Number(rows[0]?.total??0)});}catch{return failure();}}
export async function listTickets(req:NextRequest){
 if(!auth(req))return denied();
 const authorization=await ticketAdminScope(req);if('error' in authorization)return authorization.error;
 const scope=authorization.scope;const db=dbOrNull();if(!db)return unavailable();
 try{
  const filter=scope.all?'':' WHERE t.category=?';
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${safeCols} FROM tickets t${filter} ORDER BY t.tickets_id ASC`,scope.all?[]:[scope.category]);
  return json(rows.map(x=>({...x,getStatus:status(x.status)})));
 }catch{return failure();}
}
async function ticketPayload(db:NonNullable<ReturnType<typeof dbOrNull>>,row:RowDataPacket,scope?:TicketScope){
 const filter=scope&&!scope.all?' AND t.category=?':'';
 const [related]=await db.execute<RowDataPacket[]>(`SELECT ${safeCols} FROM tickets t WHERE t.is_complete=1 AND t.email <=> ?${filter}`,scope&&!scope.all?[row.email??null,scope.category]:[row.email??null]);
 const [replies]=await db.execute<RowDataPacket[]>(`SELECT r.ticket_reply_id AS id,r.uuid,r.user_id,r.ticket_id,r.reply,r.added_by,r.attachment,r.media_type,${dateSql('r.created_at')} AS created_at,${dateSql('r.updated_at')} AS updated_at FROM ticket_replies r WHERE r.ticket_id=? ORDER BY r.ticket_reply_id DESC`,[row.id]);
 const [categories]=await db.execute<RowDataPacket[]>(`SELECT name FROM ticket_categories WHERE ticket_category_id=? LIMIT 1`,[row.category??'']);
 return {ticket:{...stripSecrets(row),TicketCategory:categories.length?{name:categories[0].name}:null},relatedTickets:related.map(stripSecrets),replies,lastReply:replies[0]??null};
}
export async function ticketDetail(req:NextRequest,rawId:string){
 if(!auth(req))return denied();const id=validId(rawId);if(id===null)return bad();
 const authorization=await ticketAdminScope(req);if('error' in authorization)return authorization.error;
 const scope=authorization.scope;const db=dbOrNull();if(!db)return unavailable();
 try{
  const filter=scope.all?'':' AND t.category=?';
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullCols} FROM tickets t WHERE t.tickets_id=?${filter} LIMIT 1`,scope.all?[id]:[id,scope.category]);
  if(!rows.length)return json({message:'Ticket not found'},404);
  return json(await ticketPayload(db,rows[0],scope));
 }catch{return failure();}
}
export async function ticketTrack(req:NextRequest,number:string){if(!safeTicket(number))return bad();const url=new URL(req.url),token=url.searchParams.get('token');const path=`/support-ticket/track/${encodeURIComponent(number)}`;
 // Express redirects to frontend if missing/mismatched token. Never reflect token or contact data.
 if(!token)return Response.redirect(new URL(path,req.url),302);
 if(token.length>512)return Response.redirect(new URL(path,req.url),302);
 const db=dbOrNull();if(!db)return unavailable();try{const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${fullCols} FROM tickets t WHERE t.ticket_id=? LIMIT 1`,[number]);if(!rows.length)return json({message:'Ticket not found'},404);if(!tokenEqual(rows[0].token,token))return Response.redirect(new URL(path,req.url),302);return json(await ticketPayload(db,rows[0]));}catch{return failure();}}
export async function ticketNext(req:NextRequest,number:string){
 if(!auth(req))return denied();if(!safeTicket(number))return bad();
 const authorization=await ticketAdminScope(req);if('error'in authorization)return authorization.error;
 const scope=authorization.scope;const db=dbOrNull();if(!db)return unavailable();
 try{
  const extra=scope.all?'':' AND category=?';const args=scope.all?[number]:[number,scope.category];
  const [current]=await db.execute<RowDataPacket[]>(`SELECT tickets_id AS id FROM tickets WHERE ticket_id=?${extra} LIMIT 1`,args);
  if(!current.length)return json({next:null});
  const [next]=await db.execute<RowDataPacket[]>(`SELECT ticket_id,token FROM tickets WHERE tickets_id<?${extra} ORDER BY tickets_id DESC LIMIT 1`,scope.all?[current[0].id]:[current[0].id,scope.category]);
  return json({next:next[0]?.ticket_id??null,token:next[0]?.token??null});
 }catch{return failure();}
}
export async function ticketNextById(req:NextRequest,rawId:string){
 if(!auth(req))return denied();const id=validId(rawId);if(id===null)return json({error:'Invalid id parameter'},400);
 const authorization=await ticketAdminScope(req);if('error'in authorization)return authorization.error;
 const scope=authorization.scope;const db=dbOrNull();if(!db)return unavailable();
 try{
  const extra=scope.all?'':' AND category=?';
  const [current]=await db.execute<RowDataPacket[]>(`SELECT tickets_id AS id FROM tickets WHERE tickets_id=?${extra} LIMIT 1`,scope.all?[id]:[id,scope.category]);
  if(!current.length)return json({next:null,token:null,id:null});
  const [next]=await db.execute<RowDataPacket[]>(`SELECT tickets_id AS id,ticket_id,token FROM tickets WHERE tickets_id<?${extra} ORDER BY tickets_id DESC LIMIT 1`,scope.all?[id]:[id,scope.category]);
  return json({next:next[0]?.ticket_id??null,token:next[0]?.token??null,id:next[0]?.id??null});
 }catch{return failure();}
}
export function ticketGrid(req:NextRequest){if(!auth(req))return denied();return ticketAdminGrid(req);}
