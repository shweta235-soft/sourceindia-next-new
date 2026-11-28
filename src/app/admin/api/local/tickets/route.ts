import type {NextRequest} from 'next/server';
import {bulk109Handle} from '@/lib/localBulk109Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk109Handle(req,'tickets','list');}

// BULK122: path-scoped admin session cookie works under /admin. Isolated QA only.
import {nativeTicketWrite} from '@/lib/localBulk122TicketNative';
export async function POST(req:NextRequest){return nativeTicketWrite(req,'create');}
