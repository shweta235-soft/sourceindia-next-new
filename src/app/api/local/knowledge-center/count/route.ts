import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_KNOWLEDGE_LIST, PUBLIC_KNOWLEDGE_COUNT, PUBLIC_KNOWLEDGE_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
export const runtime = 'nodejs';
export async function GET(req:Request){
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(PUBLIC_KNOWLEDGE_COUNT,[]);
 return Response.json({total:Number(rows[0]?.total??0)});
 }catch{return Response.json({message:'Count unavailable.'},{status:503});}
}
