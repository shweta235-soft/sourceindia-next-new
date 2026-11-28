/** BULK121 write compatibility: route registration is complete, but the original
 * Express controllers still implement the underlying writes. Never enable on a
 * live DB. This is NOT a native business-logic rewrite or verified write parity.
 * SourceIndia original ticket writes can send OTP/emails, upload files, delete
 * attachments, or permanently mutate ticket and reply records.
 */
import type {NextRequest} from 'next/server';
import {legacyExpressBridgeRequest} from '@/lib/localLegacyExpressBridge';

const noStore=(message:string,status:number)=>Response.json({message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function guardedLegacyTicketWrite(request:NextRequest):Promise<Response>{
 const pathname=new URL(request.url).pathname;
 if(!pathname.startsWith('/v2/api/tickets/'))return noStore('Unknown ticket route.',404);
 if(process.env.NODE_ENV==='production')return noStore('Ticket legacy writes disabled in production.',403);
 // Two independent explicit switches: the shared bridge also requires its own
 // SOURCEINDIA_LEGACY_COMPAT_WRITES=1. Set these ONLY on an isolated QA database.
 if(process.env.SOURCEINDIA_TICKET_LEGACY_WRITES_ENABLED!=='1')
  return noStore('Ticket legacy writes disabled; isolated QA required.',403);
 if(process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES!=='1')
  return noStore('Legacy compatibility mutations disabled.',403);
 // A misconfigured QA environment should never blindly forward arbitrary URLs.
 // The bridge itself uses a fixed loopback origin and forwards no Host header.
 const allowed=new Set(['POST','PUT','PATCH','DELETE']);
 if(!allowed.has(request.method))return noStore('Method not allowed.',405);
 return legacyExpressBridgeRequest(request);
}
