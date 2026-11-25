import type { RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { enquiryQueries, parseEnquiryPaging, validEnquiryKind } from '@/lib/localEnquiryRead';

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({ message }, { status, headers });

export async function readOwnEnquiries(request: Request, kind: string, countOnly: boolean): Promise<Response> {
  if (!validEnquiryKind(kind)) return fail(404, 'Not found.');
  const page = countOnly ? null : parseEnquiryPaging(request.url);
  if (!countOnly && !page) return fail(400, 'Invalid pagination.');
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
    const q = enquiryQueries[kind];
    const [counts] = await db.execute<(RowDataPacket & { total: number })[]>(q.count, [ownerId]);
    const total = Number(counts[0]?.total ?? 0);
    if (countOnly) return Response.json({ total }, { headers });
    // Only validated integer LIMIT/OFFSET are interpolated (no user SQL fragments).
    const sql = q.list.replace('LIMIT ? OFFSET ?', `LIMIT ${page!.limit} OFFSET ${page!.offset}`);
    const [rows] = await db.execute<RowDataPacket[]>(sql, [ownerId]);
    return Response.json({ items: rows, pagination: { page: page!.page, limit: page!.limit, total } }, { headers });
  } catch {
    return fail(503, 'Local enquiry data temporarily unavailable.');
  }
}
