export type PasswordFields = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function validatePasswordChange({ oldPassword, newPassword, confirmPassword }: PasswordFields) {
  if (!oldPassword || !newPassword || !confirmPassword) return "All fields are required.";
  if (newPassword.length < 6) return "New password must be at least 6 characters long.";
  if (newPassword !== confirmPassword) return "Passwords do not match.";
  return "";
}

export async function changeAccountPassword(fields: PasswordFields, token: string, signal: AbortSignal) {
  const problem = validatePasswordChange(fields);
  if (problem) throw new Error(problem);
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch("/api/account/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(fields),
    signal,
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (response.ok && result?.success === true) return;
  throw new Error(typeof result?.message === "string" ? result.message : "Password change could not be confirmed. Try signing in with your new password before retrying.");
}
