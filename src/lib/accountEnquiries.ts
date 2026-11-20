export function enquiryCode(value: string) {
  return /^[\p{L}\p{N}][\p{L}\p{N}_.-]{0,119}$/u.test(value);
}

export async function readAccountEnquiries<T>(query: URLSearchParams, signal: AbortSignal): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`/api/account/enquiries?${query}`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.message || "Your enquiries could not be loaded.");
  return body as T;
}
