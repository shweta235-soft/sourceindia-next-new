import { accountFlag as flag } from "./userDashboard";

export function canReadLeads(user: Record<string, unknown>) {
  return flag(user.is_seller) && flag(user.is_complete) && flag(user.is_approve);
}

export function canReadLeadChat(user: Record<string, unknown>, outgoing: boolean) {
  return outgoing
    ? flag(user.is_complete) && flag(user.is_approve) && Number(user.member_role) !== 3
    : canReadLeads(user) && [1, 3].includes(Number(user.member_role));
}

export type ChatThread = {
  id: number;
  number: string;
  name: string;
  location: string;
  photo: string;
};

export type InboxMessage = { id: string; message: string; date: string; name: string; mine: boolean };

export async function readLeadInbox<T>(query: URLSearchParams, signal: AbortSignal): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/lead-inbox?${query}`, {
    signal, cache: "no-store", headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message || "Could not load enquiries.");
  return data as T;
}
