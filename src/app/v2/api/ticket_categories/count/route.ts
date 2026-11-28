import {getCategoryCount} from '@/lib/localBulk124TicketCategories';
export const runtime='nodejs';
export function GET(){return getCategoryCount();}
