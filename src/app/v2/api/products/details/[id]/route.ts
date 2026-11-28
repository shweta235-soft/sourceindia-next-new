import {bulk116ProductDetail} from '@/lib/localBulk116Products';
export const runtime='nodejs';
export async function GET(req: Request, ctx: {params:Promise<{id:string}>}){return bulk116ProductDetail(req,(await ctx.params).id);}
