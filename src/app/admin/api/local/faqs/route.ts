import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {ADMIN_FAQ_LIST,ADMIN_FAQ_COUNT,adminFaqPaging,adminFaqDeleteFlag} from '@/lib/localAdminFaq';
import {ADMIN_FAQ_INSERT,parseFaqWrite,newFaqUuid} from '@/lib/localAdminFaqWrite';
import {authorizeFaqWrite,readFaqBody,faqCategoryExists} from '@/lib/localAdminFaqWriteHttp';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const paging=adminFaqPaging(req.url),deleted=adminFaqDeleteFlag(req.url);
 if(!paging||deleted===null)return adminFaqResponse({message:'Invalid pagination or deleted filter.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [rows]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_LIST,[deleted,paging.limit,paging.offset]);
  const [count]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_COUNT,[deleted]);
  return adminFaqResponse({items:rows,total:Number(count[0]?.total??0),page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'FAQ listing unavailable.'},503);}
}

export async function POST(req:NextRequest){
 const denied=authorizeFaqWrite(req);if(denied)return denied;
 const fields=parseFaqWrite(await readFaqBody(req));if(!fields)return adminFaqResponse({message:'Invalid FAQ fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  if(!await faqCategoryExists(db,fields.category))return adminFaqResponse({message:'FAQ category not found.'},422);
  const [result]=await db.execute<ResultSetHeader>(ADMIN_FAQ_INSERT,[newFaqUuid(),fields.title,fields.description,fields.category,fields.status]);
  return adminFaqResponse({created:true,id:result.insertId},201);
 }catch{return adminFaqResponse({message:'FAQ creation unavailable.'},503);}
}
