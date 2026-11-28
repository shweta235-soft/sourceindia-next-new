import type {NextRequest} from 'next/server';
import {ticketDetail} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return ticketDetail(req,(await params).id);}

import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){return nativeTicketWrite(req,'update',(await params).id);}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){return nativeTicketWrite(req,'delete',(await params).id);}
