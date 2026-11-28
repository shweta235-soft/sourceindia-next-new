import {mainSearch} from '@/lib/localBulk128FrontMenu';
export const runtime='nodejs';
export async function POST(req:import('next/server').NextRequest){return mainSearch(req);}
