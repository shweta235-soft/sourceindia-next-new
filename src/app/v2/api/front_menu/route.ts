import {getMenus,createMenu} from '@/lib/localBulk128FrontMenu';
export const runtime='nodejs';
export async function GET(req:import('next/server').NextRequest){return getMenus();}
export async function POST(req:import('next/server').NextRequest){return createMenu(req);}
