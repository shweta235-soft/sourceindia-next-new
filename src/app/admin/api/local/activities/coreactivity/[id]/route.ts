import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {bulk101Id,bulk101Paging} from '@/lib/localBulk101Reads';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const id=bulk101Id((await params).id),paging=bulk101Paging(req.url);
 if(id===null||!paging)return adminFaqResponse({message:'Invalid ID or pagination.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(
  `SELECT a.activity_id AS id, a.uuid, a.name, a.coreactivity, a.status,
   (SELECT COUNT(*) FROM company_info ci WHERE ci.activity=a.activity_id) AS company_count
   FROM activities a WHERE a.coreactivity=? AND a.is_delete=0 ORDER BY a.activity_id ASC LIMIT ? OFFSET ?`,
  [id,paging.limit,paging.offset]);
  return adminFaqResponse({items:rows,page:paging.page,limit:paging.limit});
 }catch{return adminFaqResponse({message:'Activities unavailable.'},503);}
}
