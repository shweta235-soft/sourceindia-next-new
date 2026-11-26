import type {NextRequest} from 'next/server';
import {bulk115AdminList} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{category:string}>}){const p=await ctx.params; return bulk115AdminList(req,'product-subcategories','active',[p.category]);}
