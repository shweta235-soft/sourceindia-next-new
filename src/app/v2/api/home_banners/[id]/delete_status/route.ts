import type {NextRequest} from 'next/server';
import {bannerToggle} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,ctx:C){return bannerToggle(req,(await ctx.params).id,'is_delete');}
