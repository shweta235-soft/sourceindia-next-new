export type SourcingItem = { id: number; name: string; count: number };
export type SourcingGroup = { id: number; name: string; categories: SourcingItem[] };
export type SourcingCategory = { id: number; name: string; groups: SourcingGroup[] };
export type SourcingOption = { id: number; name: string; checked: boolean };
export type BuyerInterestGroup = { id: number; name: string; options: SourcingOption[] };
export type InterestChange = { categoryId: number; ids: number[]; action: "add" | "remove" };

export function sourcingId(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value))) return 0;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export function readBuyerInterests(signal: AbortSignal) {
  return request<{ groups: BuyerInterestGroup[] }>("?view=buyer-activities", signal);
}

export function sourcingRequest<T>(signal: AbortSignal, categoryId?: number, change?: InterestChange) {
  return request<T>(categoryId ? `?categoryId=${categoryId}` : "", signal, change);
}

async function request<T>(query: string, signal: AbortSignal, change?: InterestChange): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/sourcing-interest${query}`, {
    method: change ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(change ? { "Content-Type": "application/json" } : {}) },
    body: change ? JSON.stringify(change) : undefined,
    cache: "no-store",
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message || "Sourcing interests could not be loaded.");
  return data as T;
}
