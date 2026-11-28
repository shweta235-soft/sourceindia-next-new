import type {NextRequest} from 'next/server';
import {ticketAdminGrid} from '@/lib/localBulk121TicketAdmin';
export const runtime='nodejs';
export function GET(req:NextRequest){return ticketAdminGrid(req);}
