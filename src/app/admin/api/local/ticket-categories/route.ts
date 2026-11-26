import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
import type {ResultSetHeader} from 'mysql2/promise';
import {bulk102WriteGuard,bulk102Body} from '@/lib/localBulk102Http';
import {parseBulk102,bulk102Args,bulk102Uuid,BULK102_SQL} from '@/lib/localBulk102Writes';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const paging=bulk101Paging(req.url);if(!paging)return adminFaqResponse({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.ticketsAdmin,[paging.limit,paging.offset]);
 return adminFaqResponse({items:rows,page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'Content unavailable.'},503);}
}

export async function POST(req:NextRequest){
 const denied=bulk102WriteGuard(req);if(denied)return denied;
 const data=parseBulk102('ticket-categories',await bulk102Body(req));if(!data)return adminFaqResponse({message:'Invalid request fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(BULK102_SQL['ticket-categories'].insert,[bulk102Uuid(),...bulk102Args('ticket-categories',data)]);
  return adminFaqResponse({id:result.insertId,message:'Created.'},201);
 }catch{return adminFaqResponse({message:'Unable to create item.'},503);}
}
