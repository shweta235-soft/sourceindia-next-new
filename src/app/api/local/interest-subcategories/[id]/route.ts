import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:Request ,{params}:{params:Promise<{id:string}>}){
 const send=(body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

 const id=bulk103Id((await params).id);if(id===null)return send({message:'Invalid ID.'},400);

 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.interestPublicDetail,[id]);return rows[0]?send({item:rows[0]}):send({message:'Not found.'},404);}
 catch{return send({message:'Content unavailable.'},503);}
}
