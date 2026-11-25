import { buyerMessageDeliveryReadiness } from '@/lib/localBuyerMessageDeliveryReadinessHandler';
export const runtime='nodejs';
export async function GET(request:Request){return buyerMessageDeliveryReadiness(request);}
