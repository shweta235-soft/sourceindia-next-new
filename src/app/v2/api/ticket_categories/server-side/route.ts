import type {NextRequest} from 'next/server';
import {getCategoryGrid} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
export function GET(req:NextRequest){return getCategoryGrid(req);}
