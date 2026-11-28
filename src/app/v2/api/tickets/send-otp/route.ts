import type {NextRequest} from 'next/server';
import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export const runtime='nodejs';
export async function POST(req:NextRequest){return nativeTicketWrite(req,'sendOtp');}
