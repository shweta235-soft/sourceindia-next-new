import { validatePasswordChange, type PasswordFields } from "@/lib/accountPassword";

function reply(status: number, message: string) {
  return Response.json({ success: status === 200, message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function passwordFields(value: unknown): PasswordFields | null {
  if (typeof value !== "object" || value === null) return null;
  const { oldPassword, newPassword, confirmPassword } = value as Partial<PasswordFields>;
  if (typeof oldPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string") {
    return null;
  }
  return { oldPassword, newPassword, confirmPassword };
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return reply(401, "Please sign in again.");
  const fields = passwordFields(await request.json().catch(() => null));
  if (!fields) return reply(400, "All fields are required.");
  const problem = validatePasswordChange(fields);
  if (problem) return reply(400, problem);

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply(503, "The password service is unavailable. Check the API configuration.");

  const timeout = AbortSignal.timeout(30000);
  try {
    const upstream = await fetch(`${base}/signup/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(fields),
      signal: AbortSignal.any([request.signal, timeout]),
      redirect: "error",
      cache: "no-store",
    });
    const result: { success?: unknown; message?: unknown; error?: unknown } | null = await upstream.json().catch((error: unknown) => {
      if (timeout.aborted || request.signal.aborted) throw error;
      return null;
    });
    const message = typeof result?.message === "string" ? result.message.trim().toLowerCase().replace(/[.!]$/, "") : "";
    if (upstream.ok && result?.success !== false && !result?.error && (result?.success === true || message === "password changed successfully")) {
      return reply(200, "Password changed successfully.");
    }
    if ((upstream.status === 400 || upstream.status === 401) && message === "old password is incorrect") {
      return reply(422, "Old password is incorrect.");
    }
    if (upstream.status === 401 || upstream.status === 403) return reply(401, "Please sign in again.");
    if (upstream.status === 429) return reply(429, "Too many attempts. Wait before trying again.");
    return reply(502, "The password service did not confirm the change. Try signing in with your new password before retrying.");
  } catch {
    return timeout.aborted
      ? reply(504, "The password service took too long to respond. Try signing in with your new password before retrying.")
      : reply(502, "The password service could not be reached. Try signing in with your new password before retrying.");
  }
}
