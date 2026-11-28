import {getMenuCount} from '@/lib/localBulk128FrontMenu';
export const runtime='nodejs';
export async function GET(req:import('next/server').NextRequest){return getMenuCount();}
