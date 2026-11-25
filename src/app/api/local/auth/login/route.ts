import { compare } from "bcryptjs";
import { accountByEmail, localAccountDatabase } from "@/lib/localAccountDatabase";
import { validLoginInput, legacyBcryptHash, publicLocalAccount } from "@/lib/localPasswordLogin";
import { issueLocalAuthToken, localAuthSecret, validLocalAccount } from "@/lib/localAuthToken";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "Pragma": "no-cache" };
function response(status: number, message: string) {
  return Response.json({ message }, { status, headers });
}

/** Isolated local password-login API. No frontend switches to this route until DB & session QA. */
export async function POST(request: Request) {
  const secret = localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
  if (!secret || !localAccountDatabase()) return response(503, "Local authentication is not configured.");
  if (Number(request.headers.get("content-length") || 0) > 4096) return response(413, "Request too large.");
  let payload: unknown;
  try { payload = await request.json(); } catch { return response(400, "Invalid login request."); }
  const input = validLoginInput(payload);
  if (!input) return response(400, "Enter a valid email and password.");
  try {
    const account = await accountByEmail(input.email);
    const hash = legacyBcryptHash(account?.password);
    // Do not reveal whether the email exists; never log passwords or database hashes.
    if (!account || !hash || !await compare(input.password, hash)) return response(401, "Invalid email or password.");
    if (!validLocalAccount(account)) return response(401, "Invalid email or password.");
    const token = issueLocalAuthToken(account, secret);
    return Response.json({ message: "Login successful", token, user: publicLocalAccount(account) }, { headers });
  } catch { return response(503, "Authentication temporarily unavailable."); }
}
