import { accountFlag } from "./userDashboard";

export function canBrowseOpenEnquiries(user: Record<string, unknown>) {
  return accountFlag(user.is_seller) && accountFlag(user.is_complete) && accountFlag(user.is_approve)
    && [1, 3].includes(Number(user.member_role));
}

export function canReadOwnOpenEnquiries(user: Record<string, unknown>) {
  return !accountFlag(user.is_seller) || accountFlag(user.is_approve);
}

export function canReadConnects(user: Record<string, unknown>) {
  return accountFlag(user.is_complete) && accountFlag(user.is_approve);
}

export async function readEnquiryDirectory<T>(query: URLSearchParams, signal: AbortSignal): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/enquiry-directory?${query}`, {
    cache: "no-store", signal, headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.message || "Could not load enquiries.");
  return body as T;
}
