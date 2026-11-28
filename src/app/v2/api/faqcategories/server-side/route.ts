import {getGrid} from '@/lib/localBulk118PublicReads';
export const runtime='nodejs';
export async function GET(req:Request){return getGrid(req,'faq');}
