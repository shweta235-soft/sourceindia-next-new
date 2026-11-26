import {bulk114Summary} from '@/lib/localBulk114Catalog';
export const runtime='nodejs';
export async function GET(req:Request){return bulk114Summary(req);}
