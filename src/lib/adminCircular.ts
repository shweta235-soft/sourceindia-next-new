import type { LeadRecord } from "./adminEnquiries";

export type CircularAction = "list" | "detail" | "export" | "user-types" | "history" | "counts";
export type Circular = LeadRecord & { images: Array<{ id: string; file: string }> };
export type CircularUserType = { id: string; name: string };

export const circularPath = "/admin/email_circular";

export function userTypeLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function getCircularData<T>(action: CircularAction, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params);
  query.set("action", action);
  const response = await fetch(`/admin/circular-data?${query}`, { cache: "no-store", signal });
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.message || "Email circular data could not be loaded.");
  return body as T;
}
