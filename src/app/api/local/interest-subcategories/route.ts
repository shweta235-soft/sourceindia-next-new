import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:Request){
 const send=(body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});


 const paging=bulk103Paging(req.url);if(!paging)return send({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.interestPublic,[paging.limit,paging.offset]);return send({items:rows,page:paging.page,limit:paging.limit});}
 catch{return send({message:'Content unavailable.'},503);}
}
