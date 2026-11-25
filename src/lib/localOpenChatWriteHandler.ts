import { randomUUID } from 'node:crypto';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { ownOpenChatId, ownOpenChatQueries } from '@/lib/localOpenChatRead';
import { insertOwnedOpenChatSql, validOpenChatMessage } from '@/lib/localOpenChatWrite';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({message}, {status, headers: privateHeaders});

/** Limited to the authenticated enquiry owner until participant permissions are migrated. */
export async function sendOwnedOpenChat(request: Request, rawEnquiryId: string): Promise<Response> {
  const enquiryId = ownOpenChatId(rawEnquiryId);
  if (!enquiryId) return fail(400, 'Invalid enquiry ID.');
  if ([...new URL(request.url).searchParams.keys()].some(key => !key.startsWith('utm_'))) return fail(400, 'Unknown query parameter.');
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'JSON required.');
  if (Number(request.headers.get('content-length') ?? 0) > 8192) return fail(413, 'Request too large.');
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return fail(503, 'Local chat API is not configured.');
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  const claims = bearer && verifyLocalAuthToken(bearer.replace(/^Bearer /i, ''), secret);
  if (!claims) return fail(401, 'Please sign in again.');
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > 8192) return fail(413, 'Request too large.');
    body = JSON.parse(raw);
  } catch { return fail(400, 'Invalid JSON request.'); }
  const message = validOpenChatMessage(body);
  if (!message) return fail(400, 'Enter a message (1–2000 characters).');
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return fail(401, 'Please sign in again.');
    const [owned] = await db.execute<RowDataPacket[]>(ownOpenChatQueries.owner, [enquiryId, account.id]);
    if (!owned.length) return fail(404, 'Open enquiry not found.');
    const uuid = randomUUID();
    const [result] = await db.execute<ResultSetHeader>(insertOwnedOpenChatSql,
      [uuid, message, account.id, enquiryId, account.id, account.id]);
    return Response.json({success: true, item: {id: result.insertId, uuid, enquiry_id: enquiryId}},
      {status: 201, headers: privateHeaders});
  } catch { return fail(503, 'Local chat data temporarily unavailable.'); }
}
