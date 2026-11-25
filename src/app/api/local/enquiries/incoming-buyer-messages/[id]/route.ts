import { readLocalEnquiryDetail } from '@/lib/localEnquiryDetailHandler';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return readLocalEnquiryDetail(request, 'incoming-buyer-messages', (await context.params).id);
}
