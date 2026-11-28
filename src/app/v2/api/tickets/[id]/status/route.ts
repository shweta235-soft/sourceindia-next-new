import type {NextRequest} from 'next/server';
import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return nativeTicketWrite(req,'status',(await params).id);}
