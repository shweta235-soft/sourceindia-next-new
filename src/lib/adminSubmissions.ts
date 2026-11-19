export type SubmissionKind = "contacts" | "registrations";
export type LocationOption = { id: string; name: string };

export const registrationCategories = ["Exhibitor", "Buyer", "Delegate", "Sponsor", "Speaker", "Visitor"];

export async function getAdminSubmissions<T>(params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/admin/submission-data?${params}`, { cache: "no-store", signal });
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.message || "Unable to load records.");
  return body as T;
}
