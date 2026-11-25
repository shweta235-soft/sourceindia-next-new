import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {PUBLIC_FAQ_DETAIL,parseFaqId} from '@/lib/localFaqPublic';
export const runtime = 'nodejs';
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
  const {id:rawId}=await context.params;
  const id=parseFaqId(rawId);
  if(id===null) return Response.json({message:'Invalid FAQ ID.'},{status:400});
  const db=localAccountDatabase();
  if(!db) return Response.json({message:'Local database not configured.'},{status:503});
  try {
    const [rows]=await db.query<RowDataPacket[]>(PUBLIC_FAQ_DETAIL,[id]);
    if(!rows[0]) return Response.json({message:'FAQ not found.'},{status:404});
    return Response.json({faq:rows[0]},{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({message:'FAQ temporarily unavailable.'},{status:503});}
}
