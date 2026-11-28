import type {NextRequest} from 'next/server';
import {emailsCount} from '@/lib/localBulk142Emails';
export const runtime='nodejs';
export function GET(){return emailsCount();}
