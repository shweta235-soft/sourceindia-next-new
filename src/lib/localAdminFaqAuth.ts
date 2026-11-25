import type { NextRequest } from 'next/server';
import {adminSessionCookie, readAdminSession} from '@/lib/adminSession';

/** Admin cookies are restricted to /admin; never substitute a public/user JWT. */
export function authorizedAdminFaq(req:NextRequest):boolean {
 return Boolean(readAdminSession(req.cookies.get(adminSessionCookie)?.value));
}
export function adminFaqSameOrigin(req:NextRequest):boolean {
 const origin=req.headers.get('origin');
 if(!origin||req.headers.get('sec-fetch-site')==='cross-site')return false;
 try {
  const from=new URL(origin);
  const to=new URL(req.url);
  return from.origin===to.origin && from.host===req.headers.get('host');
 }catch{return false;}
}
export function adminFaqWriteEnabled(){return process.env.LOCAL_ADMIN_FAQ_WRITES_ENABLED==='true';}
export function adminFaqResponse(body:Record<string,unknown>,status=200){
 return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
}
