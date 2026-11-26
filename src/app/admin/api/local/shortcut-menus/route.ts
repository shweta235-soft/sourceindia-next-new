import {bulk104Handle} from '@/lib/localBulk104Admin';
import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 const send=(body:Record<string,unknown>,status=200)=>adminFaqResponse(body,status);
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);

 const paging=bulk103Paging(req.url);if(!paging)return send({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.shortcutAdmin,[paging.limit,paging.offset]);return send({items:rows,page:paging.page,limit:paging.limit});}
 catch{return send({message:'Content unavailable.'},503);}
}
export async function POST(req:NextRequest){return bulk104Handle(req,'shortcut-menus','create');}
