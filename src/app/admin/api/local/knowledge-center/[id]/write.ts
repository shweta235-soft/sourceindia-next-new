import type {NextRequest} from 'next/server';
import type {ResultSetHeader} from 'mysql2/promise';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {authorizeContent,contentBody,knowledgeFileExists} from '@/lib/localContentWriteHttp';
import {parseKnowledge,parseBitBody,KNOWLEDGE_UPDATE,KNOWLEDGE_DELETE,KNOWLEDGE_STATUS,KNOWLEDGE_DELETE_STATUS} from '@/lib/localContentWrites';
import {contentId} from '@/lib/localContentNavigation';
async function run(req:NextRequest,params:Promise<{id:string}>,kind:'edit'|'delete'|'status'|'delete_status'){
 const denied=authorizeContent(req);if(denied)return denied;
 const id=contentId((await params).id);if(id===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const fields=kind==='edit'?parseKnowledge(await contentBody(req)):kind==='delete'?null:parseBitBody(await contentBody(req),kind==='status'?'status':'is_delete');
 if(kind!=='delete'&&!fields)return adminFaqResponse({message:'Invalid fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  let sql:string;let args:(string|number)[];
  if(kind==='edit'){
   const f=fields as NonNullable<ReturnType<typeof parseKnowledge>>;
   if(!await knowledgeFileExists(db,f.file_id))return adminFaqResponse({message:'Upload image not found.'},404);
   sql=KNOWLEDGE_UPDATE;args=[f.name,f.file_id,f.video_url,f.status,id];
  }else if(kind==='delete'){sql=KNOWLEDGE_DELETE;args=[id];}
  else {sql=kind==='status'?KNOWLEDGE_STATUS:KNOWLEDGE_DELETE_STATUS;args=[(fields as {value:0|1}).value,id];}
  const [result]=await db.execute<ResultSetHeader>(sql,args);
  if(!result.affectedRows)return adminFaqResponse({message:'Knowledge center not found.'},404);
  return adminFaqResponse({message:'Knowledge center updated.',id});
 }catch{return adminFaqResponse({message:'Knowledge center unavailable.'},503);}
}
export const PUT=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'edit');
export const DELETE=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'delete');
export const PATCH_STATUS=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'status');
export const PATCH_DELETE_STATUS=(req:NextRequest,ctx:{params:Promise<{id:string}>})=>run(req,ctx.params,'delete_status');
