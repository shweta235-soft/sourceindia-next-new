import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 const send=(body:Record<string,unknown>,status=200)=>adminFaqResponse(body,status);
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);


 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.shortcutAdminCount,[]);return send({total:Number(rows[0]?.total??0)});}
 catch{return send({message:'Content unavailable.'},503);}
}
