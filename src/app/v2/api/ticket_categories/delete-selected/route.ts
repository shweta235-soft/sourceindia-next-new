import type {NextRequest} from 'next/server';
import {deleteCategories} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
export function DELETE(req:NextRequest){return deleteCategories(req);}
