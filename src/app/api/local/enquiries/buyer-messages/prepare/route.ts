import { prepareBuyerMessage } from '@/lib/localBuyerMessageDeliveryReadinessHandler';
export const runtime='nodejs';
export async function POST(request:Request){return prepareBuyerMessage(request);}
