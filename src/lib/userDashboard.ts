import { apiFetch } from "@/lib/api";

export function displayText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function accountRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function accountFlag(value: unknown) {
  return value === 1 || value === "1" || value === true;
}

export async function accountRead<T>(path: string, signal: AbortSignal): Promise<T> {
  const token = localStorage.getItem("user_token");
  if (!token) throw new Error("Please sign in again.");
  return apiFetch<T>(path, { headers: { Authorization: `Bearer ${token}` }, signal });
}
