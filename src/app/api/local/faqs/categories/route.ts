import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {PUBLIC_FAQ_CATEGORIES} from '@/lib/localFaqPublic';
export const runtime = 'nodejs';
export async function GET() {
  const db=localAccountDatabase();
  if(!db) return Response.json({message:'Local database not configured.'},{status:503});
  try {
    const [rows]=await db.query<RowDataPacket[]>(PUBLIC_FAQ_CATEGORIES);
    return Response.json({categories:rows},{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({message:'FAQ categories temporarily unavailable.'},{status:503});}
}
