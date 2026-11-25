import type {NextRequest} from 'next/server';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {adminFaqResponse,adminFaqSameOrigin,adminFaqWriteEnabled,authorizedAdminFaq} from '@/lib/localAdminFaqAuth';
import {ADMIN_FAQ_CATEGORY_EXISTS} from '@/lib/localAdminFaqWrite';

/** Return Response on denied request; null if admin write is allowed. */
export function authorizeFaqWrite(req:NextRequest):Response|null {
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(!adminFaqWriteEnabled())return adminFaqResponse({message:'FAQ write operations are disabled.'},503);
 return null;
}
export async function readFaqBody(req:NextRequest):Promise<unknown> {
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 const len=Number(req.headers.get('content-length')||'0');
 if(!Number.isFinite(len)||len>32000)return null;
 try {const text=await req.text();if(text.length>32000)return null;return JSON.parse(text);} catch {return null;}
}
export async function faqCategoryExists(db:Pool,id:number):Promise<boolean>{
 const [rows]=await db.execute<RowDataPacket[]>(ADMIN_FAQ_CATEGORY_EXISTS,[id]);
 return rows.length>0;
}
