import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { parseSellerProductPage, safeSellerProduct, sellerProductCountSql, sellerProductListSql, type LocalSellerProduct } from '@/lib/localSellerProducts';
import type { RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', Pragma: 'no-cache', Vary: 'Authorization' };
const error = (status: number, message: string) => Response.json({ message }, { status, headers });

/** Opt-in seller-only local endpoint, not connected to the existing live UI. */
export async function GET(request: Request) {
  const page = parseSellerProductPage(request.url);
  if (!page) return error(400, 'Invalid pagination parameters.');
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return error(503, 'Local product API is not configured.');
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  if (!bearer) return error(401, 'Please sign in again.');
  const claims = verifyLocalAuthToken(bearer.replace(/^Bearer /i, ''), secret);
  if (!claims) return error(401, 'Please sign in again.');
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return error(401, 'Please sign in again.');
    if (account.is_seller !== 1 || !account.company_id) return error(403, 'Seller account required.');
    const [countRows] = await db.execute<(RowDataPacket & { total: number })[]>(sellerProductCountSql, [account.id]);
    // LIMIT/OFFSET are validated integers, deliberately embedded because some MySQL prepared
    // statement configurations reject numeric placeholders for LIMIT with execute().
    const sql = sellerProductListSql.replace('LIMIT ? OFFSET ?', `LIMIT ${page.limit} OFFSET ${page.offset}`);
    const [rows] = await db.execute<(RowDataPacket & LocalSellerProduct)[]>(sql, [account.id]);
    return Response.json({ products: rows.map(safeSellerProduct), pagination: {
      page: page.page, limit: page.limit, total: Number(countRows[0]?.total ?? 0),
    } }, { headers });
  } catch {
    return error(503, 'Product list temporarily unavailable.');
  }
}
