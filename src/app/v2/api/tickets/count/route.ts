import {countTickets} from '@/lib/localBulk120Tickets';
export const runtime='nodejs';
export function GET(){return countTickets();}
