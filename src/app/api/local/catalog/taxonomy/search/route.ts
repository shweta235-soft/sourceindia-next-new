import {bulk114Search} from '@/lib/localBulk114Catalog';
export const runtime='nodejs';
export async function GET(req:Request){return bulk114Search(req);}
