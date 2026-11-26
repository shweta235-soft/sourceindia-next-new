import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:Request){
 const send=(body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});



 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.interestPublicCount,[]);return send({total:Number(rows[0]?.total??0)});}
 catch{return send({message:'Content unavailable.'},503);}
}
