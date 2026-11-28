import {getDetail} from '@/lib/localBulk119PublicReads';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){return getDetail('pages',(await params).id);}
