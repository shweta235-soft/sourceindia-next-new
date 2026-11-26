import { bulk107Handle } from '@/lib/localBulk107Writes';
import type { NextRequest } from 'next/server';
import { bulk106Handle } from '@/lib/localBulk106Admin';
export const runtime = 'nodejs';
export async function GET(req:NextRequest, { params }:{params:Promise<{id:string}>}){
 return bulk106Handle(req,'designations','detail',(await params).id);
}

export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk107Handle(req,'designations','update',(await params).id);}
