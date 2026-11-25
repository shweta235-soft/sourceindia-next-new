import type {NextRequest} from 'next/server';
import type {ResultSetHeader} from 'mysql2/promise';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {authorizeContent,contentBody} from '@/lib/localContentWriteHttp';
import {parseIds} from '@/lib/localContentWrites';
export const runtime='nodejs';
export async function DELETE(req:NextRequest){
 const denied=authorizeContent(req);if(denied)return denied;
 const ids=parseIds(await contentBody(req));if(!ids)return adminFaqResponse({message:'Invalid IDs.'},400);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const placeholders=ids.map(()=>'?').join(',');
  const [result]=await db.execute<ResultSetHeader>(`UPDATE knowledge_centers SET is_delete=1,updated_at=NOW() WHERE is_delete=0 AND knowledge_center_id IN (${placeholders})`,ids);
  return adminFaqResponse({updated:result.affectedRows});
 }catch{return adminFaqResponse({message:'Knowledge center unavailable.'},503);}
}
