import type {NextRequest} from 'next/server';
import {cloneEmail} from '@/lib/localBulk142Emails';
export const runtime='nodejs';
export function POST(req:NextRequest){return cloneEmail(req);}
