import type {RowDataPacket} from 'mysql2';
import type {NextRequest} from 'next/server';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from '@/lib/localBulk101Reads';
import type {ResultSetHeader} from 'mysql2/promise';
import {bulk102WriteGuard,bulk102Body} from '@/lib/localBulk102Http';
import {parseBulk102,bulk102Args,bulk102Uuid,BULK102_SQL} from '@/lib/localBulk102Writes';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const raw=(await params).id;
 const value=bulk101Id(raw);
 if(value===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(BULK101_SQL.seoDetail,[value]);
 if(!rows[0])return adminFaqResponse({message:'Not found.'},404);
 return adminFaqResponse({item:rows[0]});
 }catch{return adminFaqResponse({message:'Content unavailable.'},503);}
}

export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=bulk102WriteGuard(req);if(denied)return denied;
 const value=bulk101Id((await params).id);if(value===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const data=parseBulk102('seo-pages',await bulk102Body(req));if(!data)return adminFaqResponse({message:'Invalid request fields.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{
  const [result]=await db.execute<ResultSetHeader>(BULK102_SQL['seo-pages'].update,[...bulk102Args('seo-pages',data),value]);
  return result.affectedRows?adminFaqResponse({message:'Updated.'}):adminFaqResponse({message:'Not found.'},404);
 }catch{return adminFaqResponse({message:'Unable to update item.'},503);}
}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=bulk102WriteGuard(req);if(denied)return denied;
 const value=bulk101Id((await params).id);if(value===null)return adminFaqResponse({message:'Invalid ID.'},400);
 // No soft-delete field in the original table. Never hard-delete referenced records or SEO image assets by accident.
 return adminFaqResponse({message:'Hard deletion intentionally disabled; source table has no soft-delete field.',id:value},409);
}
