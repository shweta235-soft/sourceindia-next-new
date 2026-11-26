import type {NextRequest} from 'next/server';
import {bulk104Handle} from '@/lib/localBulk104Admin';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk104Handle(req,'applications','status',(await params).id);}
