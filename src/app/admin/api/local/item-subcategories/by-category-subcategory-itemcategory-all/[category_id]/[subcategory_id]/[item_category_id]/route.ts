import type {NextRequest} from 'next/server';
import {bulk115AdminList} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,ctx:{params:Promise<{category_id:string;subcategory_id:string;item_category_id:string}>}){const p=await ctx.params; return bulk115AdminList(req,'item-subcategories','all',[p.category_id,p.subcategory_id,p.item_category_id]);}
