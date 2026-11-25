import type { RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { detailKind, detailQueries, safeDetailId } from '@/lib/localEnquiryDetailRead';

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({ message }, { status, headers });
export async function readLocalEnquiryDetail(request: Request, kind: string, rawId: string): Promise<Response> {
  if (!detailKind(kind)) return fail(404, 'Not found.');
  const id = safeDetailId(rawId);
  if (!id) return fail(400, 'Invalid record ID.');
  if (new URL(request.url).searchParams.size !== 0 &&
      [...new URL(request.url).searchParams.keys()].some(k => !k.startsWith('utm_')))
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
    if (kind === 'received' && (!account.company_id || account.is_seller !== 1))
      return fail(403, 'Seller company required.');
    const ownerId = kind === 'received' ? account.company_id! : account.id;
    const [rows] = await db.execute<RowDataPacket[]>(detailQueries[kind], [id, ownerId]);
    if (!rows.length) return fail(404, 'Record not found.');
    return Response.json({ item: rows[0] }, { headers });
  } catch { return fail(503, 'Local enquiry data temporarily unavailable.'); }
}
