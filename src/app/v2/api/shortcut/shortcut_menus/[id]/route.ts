import type {NextRequest} from 'next/server';
import {updateShortcut,deleteShortcut} from '@/lib/localBulk135Shortcuts';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
export async function PUT(req:NextRequest,{params}:Ctx){return updateShortcut(req,(await params).id);}
export async function DELETE(req:NextRequest,{params}:Ctx){return deleteShortcut(req,(await params).id);}
