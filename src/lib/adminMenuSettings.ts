export type MenuKind = "front" | "shortcut";
export type MenuItem = { id: string; name: string; link: string; type: number; status: number; is_show: number; position: number };
export type MenuList = { rows: MenuItem[]; headerCount: number; footerCount: number };

export async function getMenuSettings(kind: MenuKind, parentID: string | undefined, signal: AbortSignal): Promise<MenuList> {
  const params = new URLSearchParams({ kind });
  if (parentID) params.set("parent", parentID);
  const response = await fetch(`/admin/menu-data?${params}`, { cache: "no-store", signal });
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null) throw new Error(result?.message || "Menu records could not be loaded.");
  return result as MenuList;
}
