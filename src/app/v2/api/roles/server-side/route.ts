import {getGrid} from '@/lib/localBulk119PublicReads';
export const runtime='nodejs';
export function GET(req:Request){return getGrid(req,'roles');}
