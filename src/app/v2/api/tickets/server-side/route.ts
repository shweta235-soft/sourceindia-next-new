import type {NextRequest} from 'next/server';
import {ticketGrid} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export function GET(req:NextRequest){return ticketGrid(req);}
