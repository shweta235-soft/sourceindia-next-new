import { readLocalEnquiryDetail } from '@/lib/localEnquiryDetailHandler';
export const runtime = 'nodejs';
type Context = { params: Promise<{ kind: string; id: string }> };
export async function GET(request: Request, context: Context) {
  const { kind, id } = await context.params;
  return readLocalEnquiryDetail(request, kind, id);
}
