import type {NextRequest} from 'next/server';
import {listTickets} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export function GET(req:NextRequest){return listTickets(req);}

import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export async function POST(req:NextRequest){return nativeTicketWrite(req,'create');}
