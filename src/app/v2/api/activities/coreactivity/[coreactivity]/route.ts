import {getActivitiesByCore} from '@/lib/localBulk118PublicReads';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{coreactivity:string}>}){return getActivitiesByCore((await params).coreactivity);}
