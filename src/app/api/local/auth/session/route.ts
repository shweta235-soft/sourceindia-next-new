import { accountById, localAccountDatabase } from "@/lib/localAccountDatabase";
import { publicLocalAccount } from "@/lib/localPasswordLogin";
import { bearerAuthorization } from "@/lib/accountSession";
import { verifyLocalAuthToken, localAuthSecret } from "@/lib/localAuthToken";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "Pragma": "no-cache" };
const response = (status: number, message: string) => Response.json({ message }, { status, headers });

/** No network proxy: validates local JWT and reads the current account status from local DB. */
export async function GET(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  if (!secret || !localAccountDatabase()) return response(503, "Local authentication is not configured.");
  const authorization = bearerAuthorization(request.headers.get("authorization"));
  if (!authorization) return response(401, "Please sign in again.");
  const token = authorization.replace(/^Bearer /i, "");
  const claims = verifyLocalAuthToken(token, secret);
  if (!claims) return response(401, "Please sign in again.");
  try {
    const account = await accountById(claims.id);
    if (!account || account.email !== claims.email || account.is_seller !== claims.is_seller) {
      return response(401, "Please sign in again.");
    }
    return Response.json({ user: publicLocalAccount(account) }, { headers });
  } catch { return response(503, "Authentication temporarily unavailable."); }
}
