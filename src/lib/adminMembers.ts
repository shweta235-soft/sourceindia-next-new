export type MemberKind = "buyers" | "sellers";
export type MemberVariant = "all" | "inactive" | "notApproved" | "notCompleted" | "deleted";
export type Member = Record<string, unknown>;
export type MemberList = { data: Member[]; totalRecords: number; filteredRecords: number };

export async function getAdminMemberData<T>(params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/admin/member-data?${params}`, { cache: "no-store", signal });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Members could not be loaded.");
  }
  return response.json() as Promise<T>;
}
