import {bulk111Read} from '@/lib/localBulk111Dashboard';
export const runtime='nodejs';
export async function GET(request:Request){return bulk111Read(request,'get-seller-company');}
