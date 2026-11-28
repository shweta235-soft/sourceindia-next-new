import type {NextRequest} from 'next/server';
import {ticketNextById} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){return ticketNextById(req,(await params).id);}
