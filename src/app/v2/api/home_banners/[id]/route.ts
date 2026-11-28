import type {NextRequest} from 'next/server';
import {getBanner,bannerPut,bannerDelete} from '@/lib/localBulk138HomeBanners';
export const runtime='nodejs';
type C={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,ctx:C){return getBanner((await ctx.params).id);}
export async function PUT(req:NextRequest,ctx:C){return bannerPut(req,(await ctx.params).id);}
export async function DELETE(req:NextRequest,ctx:C){return bannerDelete(req,(await ctx.params).id);}
