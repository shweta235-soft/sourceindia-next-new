import { bearerAuthorization } from "@/lib/accountSession";
import { accountById, localAccountDatabase, ownCompanyByUserId } from "@/lib/localAccountDatabase";
import { localAuthSecret, verifyLocalAuthToken } from "@/lib/localAuthToken";
import { publicLocalCompanyProfile } from "@/lib/localCompanyProfile";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Pragma: "no-cache", Vary: "Authorization" };
const error = (status: number, message: string) => Response.json({ message }, { status, headers });

/** Authenticated, read-only view of the current user's linked company. */
export async function GET(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  if (!secret || !localAccountDatabase()) return error(503, "Local company API is not configured.");
  const bearer = bearerAuthorization(request.headers.get("authorization"));
  if (!bearer) return error(401, "Please sign in again.");
  const claims = verifyLocalAuthToken(bearer.replace(/^Bearer /i, ""), secret);
  if (!claims) return error(401, "Please sign in again.");
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return error(401, "Please sign in again.");
    if (!account.company_id) return error(404, "No company linked to this account.");
    const company = await ownCompanyByUserId(account.id);
    if (!company || company.id !== account.company_id) return error(404, "Company not found.");
    return Response.json({ company: publicLocalCompanyProfile(company) }, { headers });
  } catch {
    return error(503, "Company profile temporarily unavailable.");
  }
}


/** Opt-in local company text update; existing frontend stays on live API. */
export async function PATCH(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return error(503, "Local company API is not configured.");
  const bearer = bearerAuthorization(request.headers.get("authorization"));
  if (!bearer) return error(401, "Please sign in again.");
  const claims = verifyLocalAuthToken(bearer.replace(/^Bearer /i, ""), secret);
  if (!claims) return error(401, "Please sign in again.");
  if (Number(request.headers.get("content-length") || 0) > 32768) return error(413, "Request too large.");
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 32768) return error(413, "Request too large.");
    body = JSON.parse(raw);
  } catch { return error(400, "Invalid company update request."); }
  const { parseCompanyUpdate, ownCompanyUpdateSql } = await import("@/lib/localCompanyUpdate");
  const changes = parseCompanyUpdate(body);
  if (!changes) return error(400, "Invalid or unsupported company fields.");
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller)
      return error(401, "Please sign in again.");
    if (!account.company_id) return error(404, "No company linked to this account.");
    const before = await ownCompanyByUserId(account.id);
    if (!before || before.id !== account.company_id) return error(404, "Company not found.");
    const { sql, params } = ownCompanyUpdateSql(changes, account.id);
    const [result] = await db.execute<import("mysql2").ResultSetHeader>(sql, params);
    if (result.affectedRows < 1) return error(409, "Company update could not be applied.");
    const after = await ownCompanyByUserId(account.id);
    if (!after || after.id !== account.company_id) return error(404, "Company not found.");
    return Response.json({ message: "Company profile updated", company: publicLocalCompanyProfile(after) }, { headers });
  } catch { return error(503, "Company profile temporarily unavailable."); }
}
