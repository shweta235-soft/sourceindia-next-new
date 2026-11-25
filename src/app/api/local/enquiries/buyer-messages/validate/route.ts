import { validateBuyerMessage } from '@/lib/localBuyerMessagePreviewHandler';
export const runtime='nodejs';
export async function POST(request:Request){return validateBuyerMessage(request);}
