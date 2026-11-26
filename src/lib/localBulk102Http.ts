import type {NextRequest} from 'next/server';
import {authorizedAdminFaq,adminFaqSameOrigin,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {bulk102Enabled} from '@/lib/localBulk102Writes';
export function bulk102WriteGuard(req:NextRequest):Response|null{
 if(!authorizedAdminFaq(req))return adminFaqResponse({message:'Admin session required.'},401);
 if(!adminFaqSameOrigin(req))return adminFaqResponse({message:'Request origin is not allowed.'},403);
 if(!bulk102Enabled())return adminFaqResponse({message:'Bulk102 database writes disabled.'},503);
 return null;
}
export async function bulk102Body(req:NextRequest):Promise<unknown>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 const size=Number(req.headers.get('content-length')||'0');if(!Number.isFinite(size)||size>64000)return null;
 try {const raw=await req.text();return raw.length<=64000?JSON.parse(raw):null;}catch{return null;}
}
