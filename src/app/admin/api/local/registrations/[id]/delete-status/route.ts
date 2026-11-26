import type { NextRequest } from 'next/server';
import {bulk108ContentHandle} from '@/lib/localBulk108Content';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){return bulk108ContentHandle(req,'registrations','deleteStatus',(await ctx.params).id);}
