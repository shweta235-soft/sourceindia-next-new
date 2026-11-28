import type {NextRequest} from 'next/server';
import {listNewsletters,createNewsletter} from '@/lib/localBulk145Newsletters';
export const runtime='nodejs';
export function GET(req:NextRequest){return listNewsletters();}
export function POST(req:NextRequest){return createNewsletter(req);}
