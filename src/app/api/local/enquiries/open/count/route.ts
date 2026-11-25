import { getLocalOpenEnquiries } from '@/lib/localOpenEnquiryHandler';
export const runtime = 'nodejs';
export async function GET(request: Request) { return getLocalOpenEnquiries(request, 'count'); }
