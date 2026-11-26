import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
export const runtime='nodejs';
export async function GET(req:Request){
 
 const paging=bulk101Paging(req.url);if(!paging)return Response.json({message:'Invalid pagination.'},{status:400});
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.ticketsPublic,[paging.limit,paging.offset]);
 return Response.json({items:rows,page:paging.page,limit:paging.limit}, {headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({message:'Content unavailable.'},{status:503});}
}
