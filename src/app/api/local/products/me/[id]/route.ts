import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { bearerAuthorization } from '@/lib/accountSession';
import { accountById, localAccountDatabase } from '@/lib/localAccountDatabase';
import { localAuthSecret, verifyLocalAuthToken } from '@/lib/localAuthToken';
import { safeSellerProduct, type LocalSellerProduct } from '@/lib/localSellerProducts';
import { parseSellerProductUpdate, sellerProductDetailSql, sellerProductSoftDeleteSql, sellerProductUpdateStatement, validSellerProductId } from '@/lib/localSellerProductManagement';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' };
const fail = (status: number, message: string) => Response.json({ message }, { status, headers });
type Context = { params: Promise<{ id: string }> };

async function authorize(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return { response: fail(503, 'Local product API is not configured.') };
  const bearer = bearerAuthorization(request.headers.get('authorization'));
  const claims = bearer && verifyLocalAuthToken(bearer.replace(/^Bearer /i, ''), secret);
  if (!claims) return { response: fail(401, 'Please sign in again.') };
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return { response: fail(401, 'Please sign in again.') };
    if (account.is_seller !== 1 || !account.company_id) return { response: fail(403, 'Seller account required.') };
    return { db, userId: account.id };
  } catch {
    return { response: fail(503, 'Local product API temporarily unavailable.') };
  }
}

async function detail(db: NonNullable<ReturnType<typeof localAccountDatabase>>, id: number, userId: number) {
  const [rows] = await db.execute<(RowDataPacket & LocalSellerProduct)[]>(sellerProductDetailSql, [userId, id]);
  return rows[0] ? safeSellerProduct(rows[0]) : null;
}

export async function GET(request: Request, context: Context) {
  const id = validSellerProductId((await context.params).id);
  if (!id) return fail(400, 'Invalid product ID.');
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  try {
    const product = await detail(auth.db!, id, auth.userId!);
    return product ? Response.json({ product }, { headers }) : fail(404, 'Product not found.');
  } catch { return fail(503, 'Product temporarily unavailable.'); }
}

export async function PATCH(request: Request, context: Context) {
  const id = validSellerProductId((await context.params).id);
  if (!id) return fail(400, 'Invalid product ID.');
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return fail(415, 'JSON body required.');
  let input: unknown;
  try {
    if (Number(request.headers.get('content-length') || 0) > 65536) return fail(413, 'Request too large.');
    const body = await request.text();
    if (body.length > 65536) return fail(413, 'Request too large.');
    input = JSON.parse(body);
  } catch { return fail(400, 'Invalid JSON.'); }
  const fields = parseSellerProductUpdate(input);
  if (!fields) return fail(400, 'Invalid product fields.');
  const { sql, values } = sellerProductUpdateStatement(fields);
  try {
    const [result] = await auth.db!.execute<ResultSetHeader>(sql, [...values, id, auth.userId!]);
    if (result.affectedRows < 1) return fail(404, 'Product not found.');
    const product = await detail(auth.db!, id, auth.userId!);
    return Response.json({ product }, { headers });
  } catch { return fail(503, 'Product update temporarily unavailable.'); }
}

/** Soft-delete only; no attachments, image records or database schema are removed. */
export async function DELETE(request: Request, context: Context) {
  const id = validSellerProductId((await context.params).id);
  if (!id) return fail(400, 'Invalid product ID.');
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  try {
    const [result] = await auth.db!.execute<ResultSetHeader>(sellerProductSoftDeleteSql, [id, auth.userId!]);
    if (result.affectedRows < 1) return fail(404, 'Product not found.');
    return Response.json({ success: true, deletedId: id }, { headers });
  } catch { return fail(503, 'Product deletion temporarily unavailable.'); }
}
