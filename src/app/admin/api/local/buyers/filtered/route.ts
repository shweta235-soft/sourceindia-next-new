import type {NextRequest} from 'next/server';
import {bulk109Handle} from '@/lib/localBulk109Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk109Handle(req,'buyers','filtered');}
