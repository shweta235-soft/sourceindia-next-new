import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { PUBLIC_MENU_LIST, PUBLIC_MENU_COUNT, PUBLIC_MENU_DETAIL, contentId, contentPaging, contentDeleted, menuHierarchy } from '@/lib/localContentNavigation';
export const runtime = 'nodejs';
export async function GET(req:Request,context:{params:Promise<{id:string}>}){
 const id=contentId((await context.params).id);
 if(id===null)return Response.json({message:'Invalid ID.'},{status:400});
 const db=localAccountDatabase();if(!db)return Response.json({message:'Local database unavailable.'},{status:503});
 try{const [rows]=await db.execute<RowDataPacket[]>(PUBLIC_MENU_DETAIL,[id]);
 if(!rows[0])return Response.json({message:'Not found.'},{status:404});
 return Response.json(rows[0],{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({message:'Detail unavailable.'},{status:503});}
}
