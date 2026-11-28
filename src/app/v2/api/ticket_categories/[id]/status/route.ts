import type {NextRequest} from 'next/server';
import {statusCategory} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){return statusCategory(req,(await params).id);}
