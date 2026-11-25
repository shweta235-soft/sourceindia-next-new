import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2/promise';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {contentId} from '@/lib/localContentNavigation';
import {MENU_CHILDREN} from '@/lib/localContentWrites';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=contentId((await ctx.params).id);if(id===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(MENU_CHILDREN,[id]);return adminFaqResponse({items:rows});}
 catch{return adminFaqResponse({message:'Menu unavailable.'},503);}
}
