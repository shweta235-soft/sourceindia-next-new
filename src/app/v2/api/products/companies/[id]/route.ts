import {bulk116CompanyDetail} from '@/lib/localBulk116Products';
export const runtime='nodejs';
export async function GET(req: Request, ctx: {params:Promise<{id:string}>}){return bulk116CompanyDetail(req,(await ctx.params).id);}
