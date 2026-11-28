import {updateMenuFlag} from '@/lib/localBulk128FrontMenu';
export const runtime='nodejs';
export async function PATCH(req:import('next/server').NextRequest,{params}:{params:Promise<{id:string}>}){return updateMenuFlag(req,(await params).id,'is_show');}
