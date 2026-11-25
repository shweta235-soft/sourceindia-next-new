import { getLocalOpenEnquiries } from '@/lib/localOpenEnquiryHandler';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) { return getLocalOpenEnquiries(request, 'detail', (await context.params).id); }
