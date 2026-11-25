import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse,adminFaqSameOrigin,adminFaqWriteEnabled} from '@/lib/localAdminFaqAuth';
import {ADMIN_FAQ_CATEGORY_DETAIL,ADMIN_FAQ_CATEGORY_STATUS_UPDATE,faqStatusPayload,adminFaqId} from '@/lib/localAdminFaq';
import {ADMIN_FAQ_CATEGORY_EDIT,parseCategoryWrite} from '@/lib/localAdminFaqWrite';
import {authorizeFaqWrite,readFaqBody} from '@/lib/localAdminFaqWriteHttp';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(req:NextRequest,context:C){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=adminFaqId((await context.params).id);if(id===null)return adminFaqResponse({message:'Invalid category ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [rows]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_CATEGORY_DETAIL,[id]);
  if(!rows[0])return adminFaqResponse({message:'Category not found.'},404);
  return adminFaqResponse({category:rows[0]});
 }catch{return adminFaqResponse({message:'FAQ category unavailable.'},503);}
}
export async function PATCH(req:NextRequest,context:C){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(!adminFaqWriteEnabled())return adminFaqResponse({message:'FAQ write operations are disabled.'},503);
 const id=adminFaqId((await context.params).id);if(id===null)return adminFaqResponse({message:'Invalid category ID.'},400);
 if(Number(req.headers.get('content-length')??'0')>2048)return adminFaqResponse({message:'Payload too large.'},413);
 const body=await req.json().catch(()=>null),status=faqStatusPayload(body);
 if(status===null)return adminFaqResponse({message:'status must be 0 or 1.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(ADMIN_FAQ_CATEGORY_STATUS_UPDATE,[status,id]);
  if(!result.affectedRows)return adminFaqResponse({message:'Category not found.'},404);
  return adminFaqResponse({updated:true,id,status});
 }catch{return adminFaqResponse({message:'FAQ category update unavailable.'},503);}
}

export async function PUT(req:NextRequest,context:C){
 const denied=authorizeFaqWrite(req);if(denied)return denied;
 const id=adminFaqId((await context.params).id);if(id===null)return adminFaqResponse({message:'Invalid category ID.'},400);
 const fields=parseCategoryWrite(await readFaqBody(req));if(!fields)return adminFaqResponse({message:'Invalid FAQ category fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(ADMIN_FAQ_CATEGORY_EDIT,[fields.name,fields.status,id]);
  if(!result.affectedRows)return adminFaqResponse({message:'Category not found.'},404);
  return adminFaqResponse({updated:true,id});
 }catch{return adminFaqResponse({message:'FAQ category edit unavailable.'},503);}
}
/** Category schema has no is_delete flag. Never hard-delete referenced categories. */
export async function DELETE(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 return adminFaqResponse({message:'Category soft delete unavailable: faqcategories has no is_delete column.'},409);
}
