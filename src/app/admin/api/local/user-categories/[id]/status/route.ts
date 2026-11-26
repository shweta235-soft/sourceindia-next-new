import type { NextRequest } from 'next/server';
import { bulk106Handle } from '@/lib/localBulk106Admin';
export const runtime = 'nodejs';
export async function PATCH(req:NextRequest, {params}:{params:Promise<{id:string}>}){
 return bulk106Handle(req,'user-categories','status',(await params).id);
}
