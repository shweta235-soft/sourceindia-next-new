import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 
 const raw=(await params).id;
 const value=bulk101Id(raw);
 if(value===null)return Response.json({message:'Invalid ID.'},{status:400});
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.interestsPublicDetail,[value]);
 if(!rows[0])return Response.json({message:'Not found.'},{status:404});
 return Response.json({item:rows[0]});
 }catch{return Response.json({message:'Content unavailable.'},{status:503});}
}
