import { bearerAuthorization } from "@/lib/accountSession";
import { localAccountDatabase, localProfileById } from "@/lib/localAccountDatabase";
import { localAuthSecret, verifyLocalAuthToken } from "@/lib/localAuthToken";
import { profileMatchesSession, publicLocalUserProfile } from "@/lib/localUserProfile";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Pragma: "no-cache", Vary: "Authorization" };
const error = (status: number, message: string) => Response.json({ message }, { status, headers });

/** Local authenticated profile: no upstream proxy, no writes, no cookie fallback. */
export async function GET(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  if (!secret || !localAccountDatabase()) return error(503, "Local profile API is not configured.");
  const authorization = bearerAuthorization(request.headers.get("authorization"));
  if (!authorization) return error(401, "Please sign in again.");
  const claims = verifyLocalAuthToken(authorization.replace(/^Bearer /i, ""), secret);
  if (!claims) return error(401, "Please sign in again.");
  try {
    const row = await localProfileById(claims.id);
    if (!profileMatchesSession(row, claims)) return error(401, "Please sign in again.");
    return Response.json({ user: publicLocalUserProfile(row!) }, { headers });
  } catch {
    return error(503, "Profile temporarily unavailable.");
  }
}

/** Phase 69 opt-in local basic-profile update. Existing UI continues using its original API. */
export async function PATCH(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  const db = localAccountDatabase();
  if (!secret || !db) return error(503, "Local profile API is not configured.");
  const bearer = bearerAuthorization(request.headers.get("authorization"));
  if (!bearer) return error(401, "Please sign in again.");
  const claims = verifyLocalAuthToken(bearer.replace(/^Bearer /i, ""), secret);
  if (!claims) return error(401, "Please sign in again.");
  if (Number(request.headers.get("content-length") || 0) > 8192) return error(413, "Request too large.");
  let payload: unknown;
  try { const raw = await request.text(); if (Buffer.byteLength(raw, "utf8") > 8192) return error(413, "Request too large."); payload = JSON.parse(raw); }
  catch { return error(400, "Invalid profile update request."); }
  const { parseBasicProfileUpdate, basicProfileUpdateSql } = await import("@/lib/localProfileUpdate");
  const changes = parseBasicProfileUpdate(payload);
  if (!changes) return error(400, "Invalid or unsupported profile fields.");
  try {
    const before = await localProfileById(claims.id);
    if (!profileMatchesSession(before, claims)) return error(401, "Please sign in again.");
    const { sql, params } = basicProfileUpdateSql(changes, claims.id);
    const [result] = await db.execute<import("mysql2").ResultSetHeader>(sql, params);
    if (result.affectedRows !== 1) return error(401, "Please sign in again.");
    const after = await localProfileById(claims.id);
    if (!profileMatchesSession(after, claims)) return error(401, "Please sign in again.");
    return Response.json({ message: "Basic profile updated", user: publicLocalUserProfile(after!) }, { headers });
  } catch { return error(503, "Profile temporarily unavailable."); }
}
