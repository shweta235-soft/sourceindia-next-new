import type { LeadListResult, LeadRecord } from "./adminEnquiries";

export const mailHistoryPath = "/admin/mail_history";
export const deletedMailHistoryPath = "/admin/mail-history-remove-list";
export const mailDeliveryStatuses = ["all", "pending", "success", "failed"];

export const mailCounters = [
  ["total_mail_histories", "Total", "info", "bx-bar-chart-alt-2"],
  ["pending_count", "Pending", "warning", "bx-time-five"],
  ["success_count", "Success", "success", "bx-check-circle"],
  ["opened_count", "Opened", "secondary", "bx-envelope-open"],
  ["not_opened_count", "Not Opened", "secondary", "bx-envelope"],
  ["failed_count", "Failed", "danger", "bx-error-circle"],
] as const;
export type MailHistoryResult = LeadListResult & { summary?: LeadRecord };

export function validMailCode(code: string) {
  return /^[\p{L}\p{N}_.+:-]{1,160}$/u.test(code) && code !== "." && code !== "..";
}

export function mailDetailsHref(code: string, deleted: boolean) {
  return `/admin/mail_history_details/${encodeURIComponent(code)}${deleted ? "?deleted=true" : ""}`;
}

export function mailLabel(value: string) {
  return value.replace(/_/g, " ").trim().replace(/(^|\s)\S/g, (word) => word.toUpperCase()) || "-";
}

export function mailType(value: string) {
  return value === "0" ? "Buyer" : value === "1" ? "Seller" : value || "-";
}

export function mailCount(value: unknown) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function escapeHTML(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function renderMailTemplate(body: string, name: string, email: string, loginURL: string) {
  const tokens: Record<string, string> = {
    USER_NAME: escapeHTML(name || "-"),
    USER_EMAIL: escapeHTML(email || "-"),
    USER_PASSWORD: "[hidden]",
    LOGIN_URL: escapeHTML(loginURL),
  };
  return body.replace(/\{\{\s*(USER_NAME|USER_EMAIL|USER_PASSWORD|LOGIN_URL)\s*\}\}/gi, (_, token: string) => tokens[token.toUpperCase()]);
}

export async function getMailHistory(action: "list" | "detail", params: URLSearchParams, signal?: AbortSignal) {
  params.set("action", action);
  const response = await fetch(`/admin/mail-history-data?${params}`, { cache: "no-store", signal });
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(data?.message || "Mail history could not be loaded.");
  return data as MailHistoryResult;
}
