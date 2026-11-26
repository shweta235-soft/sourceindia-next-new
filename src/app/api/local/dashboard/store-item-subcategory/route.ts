import {bulk111Write} from '@/lib/localBulk111Dashboard';
export const runtime='nodejs';
export async function POST(request:Request){return bulk111Write(request,'store-item-subcategory');}
