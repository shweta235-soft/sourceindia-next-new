import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { ADMIN_MENU_LIST, ADMIN_MENU_COUNT, ADMIN_MENU_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
import type { NextRequest } from 'next/server';
import { authorizedAdminFaq, adminFaqResponse } from '@/lib/localAdminFaqAuth';
export const runtime = 'nodejs';
export async function GET(req:NextRequest,context:{params:Promise<{id:string}>}){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=contentId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(ADMIN_MENU_DETAIL,[id]);
 if(!rows[0])return adminFaqResponse({message:'Not found.'},404);
 return adminFaqResponse({item:rows[0]});
 }catch{return adminFaqResponse({message:'Detail unavailable.'},503);}
}

import {PUT as handlePut,DELETE as handleDelete} from "./write";
export const PUT=handlePut;
export const DELETE=handleDelete;
