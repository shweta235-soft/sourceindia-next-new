import type {NextRequest} from 'next/server';
import {emailsServerSide} from '@/lib/localBulk142Emails';
export const runtime='nodejs';
export function GET(req:NextRequest){return emailsServerSide(req);}
