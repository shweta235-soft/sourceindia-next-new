import type {NextRequest} from 'next/server';
import {ticketNext} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return ticketNext(req,(await params).id);}
