import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { ADMIN_KNOWLEDGE_LIST, ADMIN_KNOWLEDGE_COUNT, ADMIN_KNOWLEDGE_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
import type { NextRequest } from 'next/server';
import { authorizedAdminFaq, adminFaqResponse } from '@/lib/localAdminFaqAuth';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const deleted=contentDeleted(req.url);if(deleted===null)return adminFaqResponse({message:'Invalid deleted filter.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(ADMIN_KNOWLEDGE_COUNT,[deleted]);
 return adminFaqResponse({total:Number(rows[0]?.total??0)});
 }catch{return adminFaqResponse({message:'Count unavailable.'},503);}
}
