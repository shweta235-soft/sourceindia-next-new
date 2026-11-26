import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
export const runtime='nodejs';
export async function GET(req:Request){
 
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.interestsPublicCount);
 return Response.json({total:Number(rows[0]?.total??0)});
 }catch{return Response.json({message:'Content unavailable.'},{status:503});}
}
