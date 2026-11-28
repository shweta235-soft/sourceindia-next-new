import {serveQaBanner} from '@/lib/localBulk139BannerWrites';
export const runtime='nodejs';
type C={params:Promise<{filename:string}>};
export async function GET(_req:Request,ctx:C){return serveQaBanner((await ctx.params).filename);}
