import type {NextRequest} from 'next/server';
import {bulk115AdminList} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
/**
 * The catch-all physical file matches the original URL's four consecutive
 * dynamic segments. A shallow file path avoids Windows ZIP extraction issues.
 * Validation and admin authorization are performed in bulk115AdminList.
 */
export async function GET(req:NextRequest,ctx:{params:Promise<{ids:string[]}>}){
 const p=await ctx.params;
 const ids=Array.isArray(p.ids)&&p.ids.length===4?p.ids:['invalid'];
 return bulk115AdminList(req,'items','all',ids);
}
