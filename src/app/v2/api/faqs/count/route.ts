import {getCount} from '@/lib/localBulk119PublicReads';
export const runtime='nodejs';
export function GET(){return getCount('faqs');}
