import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.ticketsAdminCount);
 return adminFaqResponse({total:Number(rows[0]?.total??0)});
 }catch{return adminFaqResponse({message:'Content unavailable.'},503);}
}
