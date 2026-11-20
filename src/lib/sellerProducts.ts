import { accountFlag } from "@/lib/userDashboard";

export function canManageSellerProducts(user: Record<string, unknown>) {
  return accountFlag(user.is_seller) && accountFlag(user.is_company) && [1, 3].includes(Number(user.member_role));
}

export async function readSellerProducts<T>(query: URLSearchParams, signal: AbortSignal): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/products?${query}`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.message || "Products could not be loaded.");
  return body as T;
}
