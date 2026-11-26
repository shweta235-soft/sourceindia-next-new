import type {NextRequest} from 'next/server';
import {bulk109Handle} from '@/lib/localBulk109Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk109Handle(req,'sellers','detail',(await params).id);}
