/** Central API adapter: replace the base URL in Phase 3, not individual pages. */
const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  const url = `${base}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, { ...init, cache: init.cache ?? "no-store" });
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}
export function getApiBaseUrl(): string { return base ?? ""; }
