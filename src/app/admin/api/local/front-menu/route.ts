import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import { ADMIN_MENU_LIST, ADMIN_MENU_COUNT, ADMIN_MENU_DETAIL, contentId, contentPaging, contentDeleted } from '@/lib/localContentNavigation';
import type { NextRequest } from 'next/server';
import { authorizedAdminFaq, adminFaqResponse } from '@/lib/localAdminFaqAuth';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const paging=contentPaging(req.url);if(!paging)return adminFaqResponse({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(ADMIN_MENU_LIST,[paging.limit,paging.offset]);
 return adminFaqResponse({items:rows,page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'Content unavailable.'},503);}
}

import type {ResultSetHeader} from 'mysql2/promise';
import {authorizeContent,contentBody,menuParentValid} from '@/lib/localContentWriteHttp';
import {parseMenu,contentUuid,MENU_INSERT} from '@/lib/localContentWrites';
export async function POST(req:NextRequest){
 const denied=authorizeContent(req);if(denied)return denied;
 const fields=parseMenu(await contentBody(req));if(!fields)return adminFaqResponse({message:'Invalid menu fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  if(!await menuParentValid(db,fields.parent_id,fields.type))return adminFaqResponse({message:'Invalid menu parent.'},400);
  const [result]=await db.execute<ResultSetHeader>(MENU_INSERT,[contentUuid(),fields.parent_id,fields.name,fields.link,fields.is_show,fields.status,fields.type,fields.position]);
  return adminFaqResponse({message:'Menu created.',id:result.insertId},201);
 }catch{return adminFaqResponse({message:'Front menu unavailable.'},503);}
}
