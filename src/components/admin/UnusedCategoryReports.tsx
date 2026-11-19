"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import styles from "./catalog-master.module.css";

type Group = "seller" | "product";
type Field = readonly [key: string, title: string];
const category = ["category_name", "Category"] as const;
const subcategory = ["subcategory_name", "Sub Category"] as const;
const itemCategory = ["itemcategory_name", "Item Category"] as const;
const itemSubcategory = ["item_subcategory_name", "Item Sub Category"] as const;

const tables = [
  { name: "Category", path: "categories", sellerFlag: "excludeSellerCategories", productFlag: "excludeProductCategories", fields: [], exportParents: [] },
  { name: "SubCategory", path: "sub_categories", sellerFlag: "excludeSellerSubCategories", productFlag: "excludeProductSubCategories", fields: [category], exportParents: [category] },
  { name: "Item Category", path: "item_category", productFlag: "excludeItemCategories", fields: [category, subcategory], exportParents: [category, subcategory] },
  { name: "Item Sub Category", path: "item_sub_category", productFlag: "excludeItemSubCategories", fields: [itemCategory], exportParents: [category, subcategory, itemCategory] },
  { name: "Item", path: "items", productFlag: "excludeItem", fields: [itemCategory, itemSubcategory], exportParents: [category, subcategory, itemCategory, itemSubcategory] },
] satisfies Array<{ name: string; path: string; sellerFlag?: string; productFlag: string; fields: Field[]; exportParents: Field[] }>;

const imageColumn: DashboardColumn = {
  key: "file_name", label: "Image", sortable: false, render: (row) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetUrl(leadText(row.file_name))} width={50} height={50} className={styles.image} alt="" loading="lazy"
      onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} />
  ),
};

function UnusedTable({ config, group }: { config: (typeof tables)[number]; group: Group }) {
  const { name, path, productFlag, fields, exportParents } = config;
  const flag = group === "seller" && "sellerFlag" in config ? config.sellerFlag ?? productFlag : productFlag;
  const label = group === "seller" ? "Seller" : "Product";
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("");
  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    query.set(flag, "true");
    query.set("getDeleted", "false");
    const result = await apiFetch<LeadListResult>(`${path}/server-side?${query}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    });
    if (!Array.isArray(result?.data) || !Number.isFinite(result.totalRecords) || !Number.isFinite(result.filteredRecords)) {
      throw new Error("Report records could not be loaded.");
    }
    return result;
  }, [flag, path]);

  const columns: DashboardColumn[] = [
    imageColumn,
    { key: "name", label: "Name", render: (row) => leadText(row.name) },
    ...fields.map(([key, title]) => ({ key, label: title, render: (row: LeadRecord) => leadText(row[key]) })),
    { key: "created_at", label: "Created", render: (row) => leadDate(row.created_at) },
    { key: "updated_at", label: "Last Update", render: (row) => leadDate(row.updated_at) },
  ];

  async function exportReport() {
    setStatus("");
    setExporting(true);
    try {
      const query = new URLSearchParams({ [flag]: "true", getDeleted: "false" });
      const result = await apiFetch<LeadRecord[] | { data: LeadRecord[] }>(`${path}?${query}`, { signal: AbortSignal.timeout(20000) });
      const rows = Array.isArray(result) ? result : result?.data;
      if (!Array.isArray(rows)) throw new Error("Unexpected export response.");
      if (!rows.length) {
        setStatus("No records to export.");
        return;
      }
      const records = rows.map((row) => ({
        ...row,
        getStatus: leadText(row.getStatus) || (Number(row.status) === 1 ? "Active" : "Inactive"),
        created_at: leadDate(row.created_at),
        updated_at: leadDate(row.updated_at),
      }));
      const fields: [string, string][] = [
        [name === "SubCategory" ? "Sub Category" : "Name", "name"],
        ...exportParents.map(([field, title]): [string, string] => [title, field]),
        ["Status", "getStatus"], ["Created", "created_at"], ["Last Update", "updated_at"],
      ];
      const exportName = name === "SubCategory" ? "Sub Category" : name;
      const prefix = path === "categories" || path === "sub_categories" ? `${label} ` : "";
      downloadAdminWorkbook(records, fields, `Unused ${prefix}${exportName}.xlsx`);
    } catch {
      setStatus("Excel download failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return <DashboardTable title={`Unused ${name} List of ${label}`} columns={columns} load={load}
    headerAction={<div className="d-flex align-items-center gap-2">
      {status && <span role="status">{status}</span>}
      <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={() => void exportReport()}>
        <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Preparing Excel…" : "Excel"}
      </button>
    </div>} />;
}

export default function UnusedCategoryReports({ group }: { group: Group }) {
  return <div className={styles.master}>
    <ReportsBreadcrumb page={group === "seller" ? "Sellers" : "Products"} title="Reports" />
    {tables.filter((config) => group === "product" || "sellerFlag" in config)
      .map((config) => <UnusedTable key={config.path} config={config} group={group} />)}
  </div>;
}
