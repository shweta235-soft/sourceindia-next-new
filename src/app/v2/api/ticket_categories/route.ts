import type {NextRequest} from 'next/server';
import {getCategories,createCategory} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
export function GET(){return getCategories();}
export function POST(req:NextRequest){return createCategory(req);}
