import type {NextRequest} from 'next/server';
import {bulk109Handle} from '@/lib/localBulk109Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return bulk109Handle(req,'tickets','detail',(await params).id);}

import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){return nativeTicketWrite(req,'update',(await params).id);}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){return nativeTicketWrite(req,'delete',(await params).id);}
