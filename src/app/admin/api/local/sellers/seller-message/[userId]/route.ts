import type {NextRequest} from 'next/server';
import {bulk110Handle} from '@/lib/localBulk110Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{userId:string}>}){
 const {userId}=await ctx.params;
 return bulk110Handle(req,'sellers','seller-message',userId);
}
