import { getOwnedOpenChats } from '@/lib/localOpenChatHandler';
export const runtime = 'nodejs';
type Context = {params: Promise<{id:string}>};
export async function GET(request: Request, context: Context) {
  const params = await context.params;
  return getOwnedOpenChats(request, params.id, 'list');
}

import { sendOwnedOpenChat } from '@/lib/localOpenChatWriteHandler';
export async function POST(request: Request, context: Context) {
  const params = await context.params;
  return sendOwnedOpenChat(request, params.id);
}
