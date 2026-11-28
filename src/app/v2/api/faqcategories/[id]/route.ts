import {getFaqCategoryById} from '@/lib/localBulk118PublicReads';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){return getFaqCategoryById((await params).id);}
