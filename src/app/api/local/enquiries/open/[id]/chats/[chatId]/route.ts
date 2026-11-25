import { getOwnedOpenChats } from '@/lib/localOpenChatHandler';
export const runtime = 'nodejs';
type Context = {params: Promise<{id:string;chatId:string}>};
export async function GET(request: Request, context: Context) {
  const params = await context.params;
  return getOwnedOpenChats(request, params.id, 'detail', params.chatId);
}
