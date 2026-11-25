import { buyerMessageRecipient } from '@/lib/localBuyerMessagePreviewHandler';
export const runtime='nodejs';
type Context={params:Promise<{companyId:string}>};
export async function GET(request:Request,context:Context){return buyerMessageRecipient(request,(await context.params).companyId);}
