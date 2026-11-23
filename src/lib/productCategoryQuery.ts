import { sourcingId } from "./sourcingInterest";

const hierarchyFields = [
  ["category_id", "category", "category", "category_id"],
  ["subcategory_id", "sub_category", "subcategory", "sub_category_id"],
  ["item_category_id", "item_category_id", "item_category", "item_category_id"],
  ["item_subcategory_id", "item_subcategory_id", "item_subcategory", "item_subcategory_id"],
  ["item_id", "item_id", "item", "item_id"],
] as const;

export type CategoryFilters = Partial<Record<(typeof hierarchyFields)[number][1], number[]>>;

export function productCategoryQuery(params: URLSearchParams) {
  const selected: CategoryFilters = {};
  let deepest = -1;
  let target = "";
  hierarchyFields.forEach(([queryKey, filterKey, segment], index) => {
    const id = sourcingId(params.get(queryKey));
    if (!id) return;
    deepest = index;
    target = `products/item-hierarchy/${segment}/${id}`;
    selected[filterKey] = [id];
  });
  const complete = hierarchyFields.slice(0, deepest + 1).every(([, key]) => selected[key]);
  return { selected, endpoint: complete ? "" : target };
}

export function includeProductAncestors(selected: CategoryFilters, hierarchy: Record<string, unknown>) {
  const filters: CategoryFilters = {};
  for (const [, key, , responseKey] of hierarchyFields) {
    const id = sourcingId(hierarchy[responseKey]);
    if (id) filters[key] = [id];
  }
  return { ...filters, ...selected };
}
