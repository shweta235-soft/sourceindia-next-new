import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_KNOWLEDGE_LIST, PUBLIC_KNOWLEDGE_COUNT, PUBLIC_KNOWLEDGE_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
export const runtime = 'nodejs';
export async function GET(req:Request){
 const paging=contentPaging(req.url);if(!paging)return Response.json({message:'Invalid pagination.'},{status:400});
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(PUBLIC_KNOWLEDGE_LIST,[paging.limit,paging.offset]);
 return Response.json({items:rows,page:paging.page,limit:paging.limit},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({message:'Content unavailable.'},{status:503});}
}
