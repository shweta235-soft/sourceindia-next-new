import type {NextRequest} from 'next/server';
import {newsletterUserTypes} from '@/lib/localBulk145Newsletters';
export const runtime='nodejs';
export function GET(req:NextRequest){return newsletterUserTypes();}
