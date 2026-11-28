import {bulk116FilteredProducts} from '@/lib/localBulk116Products';
export const runtime='nodejs';
export async function GET(req: Request){return bulk116FilteredProducts(req);}
