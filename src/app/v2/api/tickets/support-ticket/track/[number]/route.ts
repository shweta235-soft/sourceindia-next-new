import type {NextRequest} from 'next/server';
import {ticketTrack} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{number:string}>}){return ticketTrack(req,(await params).number);}
