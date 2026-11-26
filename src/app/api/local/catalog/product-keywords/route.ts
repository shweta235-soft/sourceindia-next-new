import {bulk114Catalog} from '@/lib/localBulk114Catalog';
export const runtime='nodejs';
export async function GET(req:Request){return bulk114Catalog(req,'product-keywords','list');}
