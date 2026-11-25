import type { RowDataPacket } from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {PUBLIC_FAQ_LIST,parseFaqPaging} from '@/lib/localFaqPublic';
export const runtime = 'nodejs';
export async function GET(request:Request) {
  const paging=parseFaqPaging(request.url);
  if(!paging) return Response.json({message:'Invalid pagination.'},{status:400});
  const db=localAccountDatabase();
  if(!db) return Response.json({message:'Local database not configured.'},{status:503});
  try {
    const [rows]=await db.query<RowDataPacket[]>(PUBLIC_FAQ_LIST,[paging.limit,paging.offset]);
    return Response.json({items:rows,page:paging.page,limit:paging.limit},{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({message:'FAQs temporarily unavailable.'},{status:503});}
}
