import type {NextRequest} from 'next/server';
import type {RowDataPacket,ResultSetHeader} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {ADMIN_FAQ_CATEGORY_LIST,ADMIN_FAQ_CATEGORY_COUNT,adminFaqPaging} from '@/lib/localAdminFaq';
import {ADMIN_FAQ_CATEGORY_INSERT,parseCategoryWrite,newFaqUuid} from '@/lib/localAdminFaqWrite';
import {authorizeFaqWrite,readFaqBody} from '@/lib/localAdminFaqWriteHttp';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const paging=adminFaqPaging(req.url);
 if(!paging)return adminFaqResponse({message:'Invalid pagination.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [rows]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_CATEGORY_LIST,[paging.limit,paging.offset]);
  const [count]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_CATEGORY_COUNT);
  return adminFaqResponse({items:rows,total:Number(count[0]?.total??0),page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'FAQ categories unavailable.'},503);}
}

export async function POST(req:NextRequest){
 const denied=authorizeFaqWrite(req);if(denied)return denied;
 const fields=parseCategoryWrite(await readFaqBody(req));if(!fields)return adminFaqResponse({message:'Invalid FAQ category fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(ADMIN_FAQ_CATEGORY_INSERT,[newFaqUuid(),fields.name,fields.status]);
  return adminFaqResponse({created:true,id:result.insertId},201);
 }catch{return adminFaqResponse({message:'FAQ category creation unavailable.'},503);}
}
