import type { RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase, type LocalSessionAccount } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { incomingMessageSql, openEnquiryPagination, openEnquirySql, positiveOpenId } from '@/lib/localOpenEnquiryRead';

const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({ message }, { status, headers: privateHeaders });
async function authenticatedAccount(request: Request): Promise<{ account: LocalSessionAccount } | { error: Response }> {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return { error: fail(503, 'Local enquiry API is not configured.') };
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  const claims = bearer && verifyLocalAuthToken(bearer.replace(/^Bearer /i, ''), secret);
  if (!claims) return { error: fail(401, 'Please sign in again.') };
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return { error: fail(401, 'Please sign in again.') };
    return { account };
  } catch {
    return { error: fail(503, 'Local enquiry data temporarily unavailable.') };
  }
}
export async function getLocalOpenEnquiries(request: Request, mode: 'list' | 'count' | 'detail', rawId?: string): Promise<Response> {
  const page = mode === 'list' ? openEnquiryPagination(request.url) : null;
  if (mode === 'list' && !page) return fail(400, 'Invalid pagination.');
  const id = mode === 'detail' ? positiveOpenId(rawId ?? '') : null;
  if (mode === 'detail' && !id) return fail(400, 'Invalid enquiry ID.');
  const result = await authenticatedAccount(request);
  if ('error' in result) return result.error;
  const db = localAccountDatabase()!;
  try {
    if (mode === 'detail') {
      const [rows] = await db.execute<RowDataPacket[]>(openEnquirySql.detail, [id, result.account.id]);
      if (!rows.length) return fail(404, 'Open enquiry not found.');
      return Response.json({ item: rows[0] }, { headers: privateHeaders });
    }
    const [countRows] = await db.execute<(RowDataPacket & { total: number })[]>(openEnquirySql.count, [result.account.id]);
    const total = Number(countRows[0]?.total ?? 0);
    if (mode === 'count') return Response.json({ total }, { headers: privateHeaders });
    const sql = openEnquirySql.list.replace('LIMIT ? OFFSET ?', `LIMIT ${page!.limit} OFFSET ${page!.offset}`);
    const [rows] = await db.execute<RowDataPacket[]>(sql, [result.account.id]);
    return Response.json({ items: rows, pagination: { page: page!.page, limit: page!.limit, total } }, { headers: privateHeaders });
  } catch { return fail(503, 'Local enquiry data temporarily unavailable.'); }
}
export async function getIncomingBuyerMessages(request: Request, countOnly: boolean): Promise<Response> {
  const page = countOnly ? null : openEnquiryPagination(request.url);
  if (!countOnly && !page) return fail(400, 'Invalid pagination.');
  const result = await authenticatedAccount(request);
  if ('error' in result) return result.error;
  const db = localAccountDatabase()!;
  try {
    const [countRows] = await db.execute<(RowDataPacket & { total: number })[]>(incomingMessageSql.count, [result.account.id]);
    const total = Number(countRows[0]?.total ?? 0);
    if (countOnly) return Response.json({ total }, { headers: privateHeaders });
    const sql = incomingMessageSql.list.replace('LIMIT ? OFFSET ?', `LIMIT ${page!.limit} OFFSET ${page!.offset}`);
    const [rows] = await db.execute<RowDataPacket[]>(sql, [result.account.id]);
    return Response.json({ items: rows, pagination: { page: page!.page, limit: page!.limit, total } }, { headers: privateHeaders });
  } catch { return fail(503, 'Local enquiry data temporarily unavailable.'); }
}
