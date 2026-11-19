export const userHistorySteps = [
  ["active_seller", "Active Seller"],
  ["inactive_seller", "Inactive Seller"],
  ["not_completed_seller", "Not Completed Seller"],
  ["not_approve_seller", "Not Approve Seller"],
  ["delete_seller", "Delete Seller"],
  ["active_buyer", "Active Buyer"],
  ["inactive_buyer", "Inactive Buyer"],
  ["not_approve_buyer", "Not Approve Buyer"],
  ["delete_buyer", "Delete Buyer"],
] as const;

export const userHistoryTextFilters = [
  ["customerId", "Customer ID"],
  ["firstName", "First Name"],
  ["lastName", "Last Name"],
  ["organizationName", "Company"],
  ["email", "Email"],
  ["mobile", "Mobile"],
] as const;

export async function getUserHistoryData<T>(
  action: "list" | "export" | "countries" | "states" | "cities",
  params?: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams(params);
  query.set("action", action);
  const response = await fetch(`/admin/user-history-data?${query}`, { cache: "no-store", signal });
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.message || "User history could not be loaded.");
  return body as T;
}
