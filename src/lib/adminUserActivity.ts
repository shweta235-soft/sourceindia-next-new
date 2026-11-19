import type { LeadRecord } from "./adminEnquiries";

export const userActivityPath = "/admin/user_activity";
export const activityCountFields = ["UserInactiveStatus", "UserActiveStatus", "UserApprove", "UserDeleted"] as const;
export type ActivityCounts = Partial<Record<(typeof activityCountFields)[number], number>>;
export type UserActivityDetail = LeadRecord & { user_activity: LeadRecord[] };

export async function getUserActivityData<T>(action: "list" | "counts" | "detail" | "export", params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params);
  query.set("action", action);
  const response = await fetch(`/admin/user-activity-data?${query}`, { cache: "no-store", signal });
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.message || "User activities could not be loaded.");
  return body as T;
}

export function activityStatus(value: unknown) {
  return value === "1" ? "Active" : value === "0" ? "Inactive" : "";
}

export function activityUserType(value: unknown) {
  return value === "1" ? "Seller" : value === "0" ? "Buyer" : "";
}
