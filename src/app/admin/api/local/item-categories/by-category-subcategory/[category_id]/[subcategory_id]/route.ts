import type {NextRequest} from 'next/server';
import {bulk115AdminList} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{category_id:string;subcategory_id:string}>}){const p=await ctx.params; return bulk115AdminList(req,'item-categories','active',[p.category_id,p.subcategory_id]);}
