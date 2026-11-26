import type {NextRequest} from 'next/server';
import {bulk110Handle} from '@/lib/localBulk110Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk110Handle(req,'buyers','get-buyer-sourcing-interests');}
