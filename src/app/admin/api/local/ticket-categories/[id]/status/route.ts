import type {NextRequest} from 'next/server';
import type {ResultSetHeader} from 'mysql2/promise';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {bulk101Id} from '@/lib/localBulk101Reads';
import {bulk102WriteGuard,bulk102Body} from '@/lib/localBulk102Http';
import {parseBulk102Status,BULK102_SQL} from '@/lib/localBulk102Writes';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=bulk102WriteGuard(req);if(denied)return denied;
 const value=bulk101Id((await params).id);if(value===null)return adminFaqResponse({message:'Invalid ID.'},400);
 const status=parseBulk102Status(await bulk102Body(req));if(status===null)return adminFaqResponse({message:'Invalid status.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [result]=await db.execute<ResultSetHeader>(BULK102_SQL['ticket-categories'].status,[status,value]);
 return result.affectedRows?adminFaqResponse({message:'Status updated.'}):adminFaqResponse({message:'Not found.'},404);
 }catch{return adminFaqResponse({message:'Unable to change status.'},503);}
}
