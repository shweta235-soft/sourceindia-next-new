import {sendBuyerMessage} from '@/lib/localBuyerMessageSendHandler';
export const runtime='nodejs';
export async function POST(request:Request){return sendBuyerMessage(request);}
