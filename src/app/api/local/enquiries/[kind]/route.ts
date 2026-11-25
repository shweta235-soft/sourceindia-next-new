import { readOwnEnquiries } from '@/lib/localEnquiryHandler';
export const runtime = 'nodejs';
type Context = { params: Promise<{ kind: string }> };
export async function GET(request: Request, context: Context) {
  return readOwnEnquiries(request, (await context.params).kind, false);
}
