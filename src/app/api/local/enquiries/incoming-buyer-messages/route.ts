import { getIncomingBuyerMessages } from '@/lib/localOpenEnquiryHandler';
export const runtime = 'nodejs';
export async function GET(request: Request) { return getIncomingBuyerMessages(request, false); }
