/** Private QA-only download: admin's /admin cookie OR ticket tracker Bearer token. */
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2/promise';
import {timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {ticketQaGate} from '@/lib/localBulk122TicketNative';
import {ticketAdminScope} from '@/lib/localBulk121TicketAdmin';
import {managedTicketFileName,loadTicketAttachment} from '@/lib/localBulk123TicketAttachments';
const denied=(message:string,status:number)=>Response.json({message},{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const equalToken=(actual:unknown,candidate:unknown)=>{
 if(typeof actual!=='string'||typeof candidate!=='string'||!candidate||candidate.length>256)return false;
 const a=Buffer.from(actual),b=Buffer.from(candidate);return a.length===b.length&&timingSafeEqual(a,b);
};
export async function privateTicketDownload(req:NextRequest,idValue:string,filename:string):Promise<Response>{
 if(ticketQaGate())return denied('QA-only ticket attachment access.',403);
 if(!/^[1-9]\d{0,14}$/.test(idValue)||!Number.isSafeInteger(Number(idValue))||!managedTicketFileName(filename))
  return denied('Invalid attachment.',400);
 const auth=req.headers.get('authorization')||'';
 const bearer=auth.startsWith('Bearer ')?auth.slice(7).trim():null;
 const scope=bearer?null:await ticketAdminScope(req);
 if(!bearer&&scope&&'error' in scope)return scope.error;
 const db=localAccountDatabase();if(!db)return denied('QA database unavailable.',503);
 try{
  const [tickets]=await db.execute<RowDataPacket[]>(`SELECT tickets_id,category,token,attachment
    FROM tickets WHERE tickets_id=? AND is_complete=1 LIMIT 1`,[Number(idValue)]);
  const ticket=tickets[0];if(!ticket)return denied('Attachment not found.',404);
  if(bearer){if(!equalToken(ticket.token,bearer))return denied('Unauthorized.',401);}
  else if(scope&&'scope' in scope&&!scope.scope.all&&Number(ticket.category)!==scope.scope.category)
   return denied('Ticket category access denied.',403);
  if(ticket.attachment!==filename){
   const [replies]=await db.execute<RowDataPacket[]>(`SELECT attachment FROM ticket_replies
     WHERE ticket_id=? AND attachment=? LIMIT 1`,[Number(idValue),filename]);
   if(!replies.length)return denied('Attachment not found.',404);
  }
  const data=await loadTicketAttachment(filename);
  return new Response(new Uint8Array(data),{status:200,headers:{
   'Content-Type':'application/octet-stream',
   'Content-Disposition':`attachment; filename="${filename}"`,
   'Cache-Control':'private, no-store',
   'X-Content-Type-Options':'nosniff',
   'Content-Security-Policy':"default-src 'none'; sandbox",
  }});
 }catch(error){if((error as NodeJS.ErrnoException)?.code==='ENOENT')return denied('Attachment not found.',404);
  return denied('Ticket attachment unavailable.',503);}
}
