"use client";

import { useEffect, useId, useState } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";

export type ProductRow = Record<string, unknown>;
type Option = { id: string | number; name: string };

export const hierarchyFields = [
  ["category", "Category"],
  ["sub_category", "Sub Category"],
  ["item_category_id", "Item Category"],
  ["item_subcategory_id", "Item Sub Category"],
  ["item_id", "Item"],
] as const;

export const text = (value: unknown) => value == null ? "" : String(value);
export const productStatuses: Option[] = [{ id: 2, name: "Private" }, { id: 1, name: "Public" }, { id: 0, name: "Draft" }];

export function hierarchyPaths(values: Record<string, string>, listing: boolean) {
  const ids = hierarchyFields.map(([field]) => encodeURIComponent(values[field] ?? ""));
  const suffix = listing ? "-all" : "";
  const path = (resource: string, depth: number) =>
    ids.slice(0, depth).every(Boolean) ? `${resource}${suffix}/${ids.slice(0, depth).join("/")}` : "";
  return [
    listing ? "categories" : "categories?is_delete=0",
    path("sub_categories/category", 1),
    path("item_category/by-category-subcategory", 2),
    path("item_sub_category/by-category-subcategory-itemcategory", 3),
    path("items/by-category-subcategory-itemcategory-itemsubcategory", 4),
  ];
}

export function changeHierarchy(values: Record<string, string>, index: number, value: string) {
  const next = { ...values };
  hierarchyFields.slice(index).forEach(([field], offset) => { next[field] = offset === 0 ? value : ""; });
  return next;
}

export function ProductSelect({ label, value, onChange, endpoint, nameKey = "name", entries, emptyLabel = "All", required = false }: {
  label: string; value: string; onChange: (value: string) => void; endpoint?: string; nameKey?: string;
  entries?: Option[]; emptyLabel?: string; required?: boolean;
}) {
  const id = useId();
  const [result, setResult] = useState<{ endpoint: string; rows: Option[]; failed?: boolean }>();
  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController();
    apiFetch<ProductRow[] | { data?: ProductRow[] }>(endpoint, { signal: controller.signal })
      .then((response) => {
        const rows = Array.isArray(response) ? response : response?.data;
        if (!Array.isArray(rows)) throw new Error("Invalid dropdown response");
        if (!controller.signal.aborted) setResult({
          endpoint,
          rows: rows.flatMap((row) => typeof row.id === "number" || typeof row.id === "string"
            ? [{ id: row.id, name: text(row[nameKey] ?? row.name ?? row.id) }]
            : []),
        });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ endpoint, rows: [], failed: true }); });
    return () => controller.abort();
  }, [endpoint, nameKey]);

  const loaded = result?.endpoint === endpoint ? result : undefined;
  const options = entries ?? loaded?.rows ?? [];
  return <>
    <label className={`form-label${required ? " required" : ""}`} htmlFor={id}>{label}</label>
    <select id={id} className="form-select" value={value} onChange={(event) => onChange(event.target.value)}
      disabled={!endpoint && !entries} required={required}>
      <option value="">{emptyLabel}</option>
      {value && !options.some((option) => String(option.id) === value) && <option value={value}>{value}</option>}
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
    {loaded?.failed && <small role="status">Options could not be loaded.</small>}
  </>;
}

export function ProductImage({ file, size = 40 }: { file: unknown; size?: number }) {
  return <img src={assetUrl(text(file))} width={size} height={size} className="object-fit-cover rounded" loading="lazy" alt=""
    onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} />;
}
