import {bulk104Handle} from '@/lib/localBulk104Admin';
import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {BULK103_SQL,bulk103Id,bulk103Paging} from '@/lib/localBulk103Reads';
export const runtime='nodejs';
export async function GET(req:NextRequest ,{params}:{params:Promise<{id:string}>}){
 const send=(body:Record<string,unknown>,status=200)=>adminFaqResponse(body,status);
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=bulk103Id((await params).id);if(id===null)return send({message:'Invalid ID.'},400);

 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK103_SQL.shortcutAdminDetail,[id]);return rows[0]?send({item:rows[0]}):send({message:'Not found.'},404);}
 catch{return send({message:'Content unavailable.'},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'shortcut-menus','update',(await params).id);}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'shortcut-menus','delete',(await params).id);}
