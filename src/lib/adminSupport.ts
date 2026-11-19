import type { LeadRecord } from "./adminEnquiries";

export type SupportList = "tickets" | "ticket_categories";
export type SupportOption = { id: string; name: string };
export type TicketDetail = { ticket: LeadRecord; replies: LeadRecord[]; lastReply: LeadRecord };

export const supportStatuses = ["Pending", "Open", "Resolved", "Cancel"];
export const supportPriorities = ["Normal", "Medium", "High", "Critical"];

export async function getSupportData<T>(action: string, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params);
  query.set("action", action);
  const response = await fetch(`/admin/support-data?${query}`, { signal, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(data?.message || "Support data could not be loaded.");
  return data as T;
}
