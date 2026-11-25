import type { RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { ownOpenChatId, ownOpenChatPaging, ownOpenChatQueries } from '@/lib/localOpenChatRead';

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({message}, {status, headers});
export async function getOwnedOpenChats(request: Request, rawEnquiryId: string, mode: 'list'|'count'|'detail', rawChatId?: string): Promise<Response> {
  const enquiryId = ownOpenChatId(rawEnquiryId);
  if (!enquiryId) return fail(400, 'Invalid enquiry ID.');
  const chatId = mode === 'detail' ? ownOpenChatId(rawChatId ?? '') : null;
  if (mode === 'detail' && !chatId) return fail(400, 'Invalid chat ID.');
  const paging = mode === 'list' ? ownOpenChatPaging(request.url) : null;
  if (mode === 'list' && !paging) return fail(400, 'Invalid pagination.');
  if (mode !== 'list' && [...new URL(request.url).searchParams.keys()].some(key => !key.startsWith('utm_')))
    return fail(400, 'Unknown query parameter.');
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return fail(503, 'Local enquiry API is not configured.');
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  const claims = bearer && verifyLocalAuthToken(bearer.replace(/^Bearer /i, ''), secret);
  if (!claims) return fail(401, 'Please sign in again.');
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return fail(401, 'Please sign in again.');
    const [owned] = await db.execute<RowDataPacket[]>(ownOpenChatQueries.owner, [enquiryId, account.id]);
    if (!owned.length) return fail(404, 'Open enquiry not found.');
    if (mode === 'detail') {
      const [rows] = await db.execute<RowDataPacket[]>(ownOpenChatQueries.detail, [enquiryId, chatId]);
      if (!rows.length) return fail(404, 'Chat not found.');
      return Response.json({item: rows[0]}, {headers});
    }
    const [counts] = await db.execute<(RowDataPacket & {total:number})[]>(ownOpenChatQueries.count, [enquiryId]);
    const total = Number(counts[0]?.total ?? 0);
    if (mode === 'count') return Response.json({total}, {headers});
    const sql = ownOpenChatQueries.list.replace('LIMIT ? OFFSET ?', `LIMIT ${paging!.limit} OFFSET ${paging!.offset}`);
    const [rows] = await db.execute<RowDataPacket[]>(sql, [enquiryId]);
    return Response.json({items: rows, pagination:{page:paging!.page, limit:paging!.limit, total}}, {headers});
  } catch {
    return fail(503, 'Local enquiry data temporarily unavailable.');
  }
}
