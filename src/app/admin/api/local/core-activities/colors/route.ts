import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
export const runtime='nodejs';
export async function GET(req:NextRequest) {
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 const db=localAccountDatabase();if(!db)return adminFaqResponse({message:'Local database unavailable.'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(
  'SELECT color_id AS id, uuid, title, status, created_at, updated_at FROM colors ORDER BY color_id ASC LIMIT 200');
  return adminFaqResponse({items:rows});
 }catch{return adminFaqResponse({message:'Colors unavailable.'},503);}
}
