import {getSeoBySlug} from '@/lib/localBulk119PublicReads';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}){return getSeoBySlug((await params).slug);}
