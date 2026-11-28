import {getMenuDetail,updateMenu,deleteMenu} from '@/lib/localBulk128FrontMenu';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){return getMenuDetail((await params).id);}
export async function PUT(req:import('next/server').NextRequest,{params}:{params:Promise<{id:string}>}){return updateMenu(req,(await params).id);}
export async function DELETE(req:import('next/server').NextRequest,{params}:{params:Promise<{id:string}>}){return deleteMenu(req,(await params).id);}
