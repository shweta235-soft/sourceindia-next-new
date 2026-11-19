export const managementLists = {
  roles: {
    title: "Roles",
    section: "Management Portal",
    heading: "Roles",
    fields: ["id", "name", "ticket_category", "category_name", "status", "getStatus", "created_at", "updated_at"],
    sort: ["id", "name", "category_name"],
  },
  sub_admin: {
    title: "Sub Admin",
    section: "Management Portal",
    heading: "Sub Admin",
    fields: ["id", "name", "email", "mobile", "role", "role_name", "status", "address", "getStatus", "created_at", "updated_at"],
    sort: ["id", "name", "role_name"],
  },
  category_conflict_logs: {
    title: "Conflict Logs",
    section: "Category Master",
    heading: "Logs",
    fields: ["id", "source_module", "conflict_module", "conflict_flow", "conflict_name", "created_at"],
    sort: ["id", "source_module", "conflict_module", "conflict_flow", "conflict_name", "created_at"],
  },
};

export type ManagementList = keyof typeof managementLists;
export type ManagementOption = { id: string; name: string };

export async function readManagementData<T>(kind: ManagementList, action: "list" | "options" | "export",
  query = new URLSearchParams(), signal?: AbortSignal): Promise<T> {
  query.set("kind", kind);
  query.set("action", action);
  const response = await fetch(`/admin/management-data?${query}`, { cache: "no-store", signal });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Management data could not be loaded.");
  }
  return response.json() as Promise<T>;
}
