import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { ADMIN_KNOWLEDGE_LIST, ADMIN_KNOWLEDGE_COUNT, ADMIN_KNOWLEDGE_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
import type { NextRequest } from 'next/server';
import { authorizedAdminFaq, adminFaqResponse } from '@/lib/localAdminFaqAuth';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const deleted=contentDeleted(req.url);if(deleted===null)return adminFaqResponse({message:'Invalid deleted filter.'},400);
 const paging=contentPaging(req.url);if(!paging)return adminFaqResponse({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(ADMIN_KNOWLEDGE_LIST,[deleted,paging.limit,paging.offset]);
 return adminFaqResponse({items:rows,page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'Content unavailable.'},503);}
}

import type {ResultSetHeader} from 'mysql2/promise';
import {authorizeContent,contentBody,knowledgeFileExists} from '@/lib/localContentWriteHttp';
import {parseKnowledge,contentUuid,KNOWLEDGE_INSERT} from '@/lib/localContentWrites';
export async function POST(req:NextRequest){
 const denied=authorizeContent(req);if(denied)return denied;
 const fields=parseKnowledge(await contentBody(req));if(!fields)return adminFaqResponse({message:'Invalid knowledge center fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  if(!await knowledgeFileExists(db,fields.file_id))return adminFaqResponse({message:'Upload image not found.'},404);
  const [result]=await db.execute<ResultSetHeader>(KNOWLEDGE_INSERT,[contentUuid(),fields.name,fields.file_id,fields.video_url,fields.status]);
  return adminFaqResponse({message:'Knowledge center created.',id:result.insertId},201);
 }catch{return adminFaqResponse({message:'Knowledge center unavailable.'},503);}
}
