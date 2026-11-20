export type SourcingItem = { id: number; name: string; count: number };
export type SourcingGroup = { id: number; name: string; categories: SourcingItem[] };
export type SourcingCategory = { id: number; name: string; groups: SourcingGroup[] };
export type SourcingOption = { id: number; name: string; checked: boolean };
export type InterestChange = { categoryId: number; ids: number[]; action: "add" | "remove" };

export function sourcingId(value: unknown) {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value))) return 0;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export async function sourcingRequest<T>(signal: AbortSignal, categoryId?: number, change?: InterestChange): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const query = categoryId ? `?categoryId=${categoryId}` : "";
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
