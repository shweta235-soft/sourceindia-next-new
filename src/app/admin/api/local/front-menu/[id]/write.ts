import type {NextRequest} from 'next/server';
import type {ResultSetHeader,RowDataPacket} from 'mysql2/promise';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {authorizeContent,contentBody,menuParentValid} from '@/lib/localContentWriteHttp';
import {parseMenu,parseBitBody,MENU_UPDATE,MENU_DELETE,MENU_CHILD_COUNT} from '@/lib/localContentWrites';
import {contentId} from '@/lib/localContentNavigation';
async function run(req:NextRequest,params:Promise<{id:string}>,kind:'edit'|'delete'|'status'|'is_show'){
 const denied=authorizeContent(req);if(denied)return denied;
 const id=contentId((await params).id);if(id===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const fields=kind==='edit'?parseMenu(await contentBody(req)):kind==='delete'?null:parseBitBody(await contentBody(req),kind==='is_show'?'is_show':'status');
 if(kind!=='delete'&&!fields)return adminFaqResponse({message:'Invalid fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  let sql:string;let args:(string|number)[];
  if(kind==='edit'){
   const f=fields as NonNullable<ReturnType<typeof parseMenu>>;
   if(!await menuParentValid(db,f.parent_id,f.type,id))return adminFaqResponse({message:'Invalid menu parent.'},400);
   sql=MENU_UPDATE;args=[f.parent_id,f.name,f.link,f.is_show,f.status,f.type,f.position,id];
  }else if(kind==='delete'){
   const [children]=await db.execute<RowDataPacket[]>(MENU_CHILD_COUNT,[id]);
   if(Number(children[0]?.total||0)>0)return adminFaqResponse({message:'Delete child menus first.'},409);
   sql=MENU_DELETE;args=[id];
  }else{const column=kind==='status'?'status':'is_show';sql=`UPDATE front_menu SET ${column}=?,updated_at=NOW() WHERE front_menu_id=?`;args=[(fields as {value:0|1}).value,id];}
  const [result]=await db.execute<ResultSetHeader>(sql,args);
  if(!result.affectedRows)return adminFaqResponse({message:'Menu not found.'},404);
  return adminFaqResponse({message:'Menu updated.',id});
 }catch{return adminFaqResponse({message:'Front menu unavailable.'},503);}
}
export const PUT=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'edit');
export const DELETE=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'delete');
export const PATCH_STATUS=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'status');
export const PATCH_SHOW=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'is_show');
