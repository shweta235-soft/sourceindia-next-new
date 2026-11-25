import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { ADMIN_MENU_LIST, ADMIN_MENU_COUNT, ADMIN_MENU_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
import type { NextRequest } from 'next/server';
import { authorizedAdminFaq, adminFaqResponse } from '@/lib/localAdminFaqAuth';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(ADMIN_MENU_COUNT,[]);
 return adminFaqResponse({total:Number(rows[0]?.total??0)});
 }catch{return adminFaqResponse({message:'Count unavailable.'},503);}
}
