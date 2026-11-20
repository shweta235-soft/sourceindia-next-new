export function enquiryCode(value: string) {
  return /^[\p{L}\p{N}][\p{L}\p{N}_.-]{0,119}$/u.test(value);
}

export const MAX_ENQUIRY_MESSAGE_LENGTH = 5000;

export async function readAccountEnquiries<T>(query: URLSearchParams, signal: AbortSignal, payload?: { number: string; message: string }): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/enquiries?${query}`, {
    method: payload ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
    signal, cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.message || "Your enquiries could not be loaded.");
  return body as T;
}
