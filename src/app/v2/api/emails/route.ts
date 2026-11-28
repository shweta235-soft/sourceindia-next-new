import type {NextRequest} from 'next/server';
import {listEmails,createEmail} from '@/lib/localBulk142Emails';
export const runtime='nodejs';
export function GET(){return listEmails();}
export function POST(req:NextRequest){return createEmail(req);}
