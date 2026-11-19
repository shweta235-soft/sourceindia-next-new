"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import { changeHierarchy, hierarchyFields, hierarchyPaths, ProductImage, ProductSelect, productStatuses, text, type ProductRow } from "./ProductFields";
import styles from "./catalog-master.module.css";

type Variant = "all" | "approved" | "draft" | "deleted";
type ListResponse = { data: ProductRow[]; totalRecords: number; filteredRecords: number };
const titles: Record<Variant, string> = {
  all: "Products List", approved: "Products List", draft: "Not Approve Product List", deleted: "Recently Deleted Product",
};
const exportTitles: Record<Variant, string> = {
  all: "Products", approved: "Approve Product", draft: "Not Approve Product", deleted: "Product Remove List",
};
const exportColumns: [string, string][] = [
  ["ID", "id"], ["Title", "title"], ["Code", "code"], ["Category", "category_name"],
  ["SubCategory", "subcategory_name"], ["Item Category", "item_category_name"],
  ["Item SubCategory", "item_subcategory_name"], ["Item", "item_name"], ["Color", "color_name"],
  ["Status", "getStatus"], ["Organization Name", "company_name"], ["Created", "created_at"], ["Last Update", "updated_at"],
];
const headings = [
  ["title", "Product"], ["category_name", "Category"], ["company_name", "Company"],
  ["created_at", "Created At"], ["updated_at", "Updated At"],
] as const;
const statuses = [["status", "Status"], ["is_approve", "Approve"]] as const;
function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(text(value));
  if (!Number.isFinite(date.getTime())) return text(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${date.getHours() % 12 || 12}:${pad(date.getMinutes())} ${date.getHours() >= 12 ? "PM" : "AM"}`;
}

function ProductLink({ slug, path, children }: { slug: unknown; path: string; children: string }) {
  return slug ? <Link href={`/${path}/${encodeURIComponent(text(slug))}`} target="_blank" rel="noopener noreferrer">{children}</Link> : children;
}

function Listing({ variant, userId, companyId }: { variant: Variant; userId: string; companyId: string }) {
  const deleted = variant === "deleted";
  const title = titles[variant];
  const [draft, setDraft] = useState<Record<string, string>>({ company: companyId });
  const [filters, setFilters] = useState(draft);
  const [datesOpen, setDatesOpen] = useState(false);
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "id", direction: "DESC" });
  const [result, setResult] = useState<{ query: string; payload?: ListResponse; failed?: boolean }>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const parameters = new URLSearchParams({
    page: String(page), limit: String(limit), search, sortBy: sort.field, sort: sort.direction,
    getDeleted: String(deleted),
  });
  if (variant === "approved" || variant === "draft") parameters.set("is_approve", variant === "approved" ? "1" : "0");
  if (userId) parameters.set("user_id", userId);
  for (const [key, value] of Object.entries(filters)) {
    if (value) parameters.set(key, value);
  }
  if (filters.startDate && filters.endDate) parameters.set("dateRange", "customrange");
  const query = parameters.toString();

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<ListResponse>(`products/server-side?${query}`, { signal: controller.signal })
      .then((payload) => {
        if (!Array.isArray(payload?.data)) throw new Error("Invalid product response");
        if (!controller.signal.aborted) setResult({ query, payload });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ query, failed: true }); });
    return () => controller.abort();
  }, [query]);

  const state = result?.query === query ? result : undefined;
  const rows = state?.payload?.data ?? [];
  const total = state?.payload?.totalRecords ?? 0;
  const filtered = state?.payload?.filteredRecords ?? total;
  const pageCount = Math.ceil(filtered / limit);
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const allChecked = rows.length > 0 && rows.every(({ id }) => selected.has(text(id)));
  const endpoints = hierarchyPaths(draft, true);

  function setDraftValue(field: string, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function selectRows(ids: string[], checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  }

  async function exportProducts() {
    setExportError(false);
    setExporting(true);
    try {
      const fullQuery = new URLSearchParams(query);
      fullQuery.set("limit", "100000");
      fullQuery.set("page", "1");
      const response = await apiFetch<ListResponse>(`products/server-side?${fullQuery}`);
      downloadAdminWorkbook(response.data.map((row) => ({
        ...row,
        created_at: formatDate(row.created_at),
        updated_at: formatDate(row.updated_at),
      })), exportColumns, `${exportTitles[variant]} Export.xlsx`);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  function header(field: string, label: string) {
    const active = sort.field === field;
    return <th scope="col" key={field} aria-sort={active ? sort.direction === "ASC" ? "ascending" : "descending" : undefined}>
      <button type="button" className={styles.sort} onClick={() => {
        setPage(1);
        setSort({ field, direction: active && sort.direction === "ASC" ? "DESC" : "ASC" });
      }}>{label}<span aria-hidden="true">{active ? sort.direction === "ASC" ? "↑" : "↓" : "↕"}</span></button>
    </th>;
  }

  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
      <div>
        <h4 className={`mb-1 ${styles.heading}`}>{title}{total > 0 && <span className={`badge ms-2 ${styles.count}`}>{total}</span>}</h4>
        <nav className="page-breadcrumb mb-3 d-none d-sm-block" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
            <li className="breadcrumb-item">Products</li>
            <li className="breadcrumb-item active" aria-current="page">{title}</li>
          </ol>
        </nav>
      </div>
      <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
        <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={() => void exportProducts()}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
        {!deleted && <button className="btn btn-sm btn-danger" type="button" disabled><i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected</button>}
        <Link className="btn btn-sm btn-primary" href={deleted ? "/admin/products" : "/admin/product-remove"}>{deleted ? "Back" : "Recently Deleted Product"}</Link>
        {!deleted && <Link className="btn btn-primary" href="/admin/add_product"><i className="bx bxs-plus-square me-1" aria-hidden="true" />Add Product</Link>}
      </div>
    </div>
    {exportError && <p className="alert alert-danger" role="alert">The Excel export could not be loaded.</p>}
    <form className="card mb-3" onSubmit={(event) => {
      event.preventDefault();
      setPage(1);
      setSelected(new Set());
      setFilters(draft);
    }}>
      <div className="card-body"><div className="row align-items-end">
        {!deleted && <>
          {hierarchyFields.map(([field, label], index) => <div key={field} className="col-md-3 mb-3">
            <ProductSelect label={label} endpoint={endpoints[index]} value={draft[field] ?? ""}
              onChange={(value) => setDraft((previous) => changeHierarchy(previous, index, value))} />
          </div>)}
          <div className="col-md-3 mb-3"><ProductSelect label="Company" endpoint="products/companies?is_approve=2"
            nameKey="organization_name" value={draft.company ?? ""} onChange={(value) => setDraftValue("company", value)} /></div>
          <div className="col-md-3 mb-3"><ProductSelect label="Status" entries={productStatuses}
            emptyLabel="-- Select --" value={draft.product_status ?? ""} onChange={(value) => setDraftValue("product_status", value)} /></div>
        </>}
        <div className={deleted ? "col-md-8" : "col-md-6 mb-3"}>
          <span className="form-label d-block">Date Filter:</span>
          <button className="form-control text-start" type="button" aria-expanded={datesOpen} onClick={() => setDatesOpen((value) => !value)}>
            <i className="bx bx-calendar me-2" aria-hidden="true" />
            {draft.startDate && draft.endDate ? `${draft.startDate} - ${draft.endDate}` : "Select Date Range"}
          </button>
          {datesOpen && <div className="d-flex gap-2 flex-wrap mt-2">
            <label>Start date<input className="form-control" type="date" value={draft.startDate ?? ""}
              max={draft.endDate || undefined} required={Boolean(draft.endDate)} onChange={(event) => setDraftValue("startDate", event.target.value)} /></label>
            <label>End date<input className="form-control" type="date" value={draft.endDate ?? ""}
              min={draft.startDate || undefined} required={Boolean(draft.startDate)} onChange={(event) => setDraftValue("endDate", event.target.value)} /></label>
          </div>}
        </div>
        <div className={`${deleted ? "col-md-4" : "col-12"} d-flex justify-content-end gap-2`}>
          <button className="btn btn-primary" type="submit">Apply</button>
          <button className="btn btn-secondary" type="button" onClick={() => {
            setDraft({}); setFilters({}); setPage(1); setSelected(new Set()); setDatesOpen(false);
          }}>Clear</button>
        </div>
      </div></div>
    </form>
    <div className="card"><div className="card-body">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 border-bottom pb-4 mt-2">
        <label className="d-flex align-items-center gap-2"><select className="form-select form-select-sm w-auto"
          aria-label="Entries per page" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
          {[25, 50, 100].map((value) => <option key={value}>{value}</option>)}
        </select>entries per page</label>
        <label className="d-flex align-items-center gap-2">Search:<input className={`form-control form-control-sm ${styles.search}`}
          value={search} placeholder="Search..." onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
      </div>
      <div className="table-responsive border rounded-2 mt-4">
        <table className="table table-striped table-hover align-middle dataTable mb-0">
          <thead><tr>
            {!deleted && <th scope="col"><input type="checkbox" checked={allChecked} disabled={!rows.length}
              onChange={(event) => selectRows(rows.map(({ id }) => text(id)), event.target.checked)} aria-label="Select all products on page" /></th>}
            {header("id", "S.No.")}
            <th scope="col">Image</th>
            {headings.map(([field, label]) => header(field, label))}
            {statuses.map(([field, label]) => <th key={field} scope="col">{label}</th>)}
            <th scope="col">Action</th>
          </tr></thead>
          <tbody>
            {!rows.length && <tr><td colSpan={deleted ? 10 : 11} className="text-center">
              {state?.failed ? "Products could not be loaded." : state ? "No matching records found" : "Loading..."}
            </td></tr>}
            {rows.map((row, index) => {
              const id = text(row.id);
              const name = text(row.title).toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
              return <tr key={id}>
                {!deleted && <td><input type="checkbox" checked={selected.has(id)} aria-label={`Select ${name}`}
                  onChange={(event) => selectRows([id], event.target.checked)} /></td>}
                <td>{(page - 1) * limit + index + 1}</td>
                <td><ProductImage file={row.file_name} /></td>
                <td><ProductLink slug={row.slug} path="products">{name}</ProductLink></td>
                <td>{text(row.category_name)}</td>
                <td><ProductLink slug={row.company_slug} path="companies">{text(row.company_name)}</ProductLink></td>
                <td>{formatDate(row.created_at)}</td><td>{formatDate(row.updated_at)}</td>
                {statuses.map(([field, label]) => <td key={field}><div className="form-check form-switch">
                  <input type="checkbox" disabled className="form-check-input" checked={Number(row[field]) === 1} aria-label={`${label} for ${name}`} />
                </div></td>)}
                <td><div className="dropdown">
                  <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label={`Actions for ${name}`}>
                    <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
                  </button>
                  <ul className="dropdown-menu">
                    {deleted ? <li><button className="dropdown-item" type="button" disabled><i className="bx bx-windows me-2" aria-hidden="true" />Restore</button></li>
                      : <li><Link className="dropdown-item" href={`/admin/edit_product/${encodeURIComponent(id)}`}><i className="bx bx-edit me-2" aria-hidden="true" />Edit</Link></li>}
                    <li><button className="dropdown-item" type="button" disabled><i className="bx bx-trash me-2" aria-hidden="true" />Delete</button></li>
                  </ul>
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center mt-4">
        <span>Showing {rows.length ? (page - 1) * limit + 1 : 0} to {rows.length ? (page - 1) * limit + rows.length : 0} of {filtered} entries{filtered < total ? ` (filtered from ${total} total entries)` : ""}</span>
        <nav className="btn-group btn-group-sm" aria-label="Table pages">
          <button type="button" className="btn btn-outline-secondary" disabled={!state || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          {Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index).map((number) =>
            <button type="button" key={number} className={`btn ${number === page ? "btn-primary" : "btn-outline-secondary"}`}
              aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" className="btn btn-outline-secondary" disabled={!state || page >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      </div>
    </div></div>
  </div>;
}

function ListingFromUrl({ variant }: { variant: Variant }) {
  const params = useSearchParams();
  const userId = params.get("id") ?? "";
  const companyId = variant === "deleted" ? "" : params.get("cid") ?? "";
  return <Listing key={`${variant}/${userId}/${companyId}`} variant={variant} userId={userId} companyId={companyId} />;
}

export default function AdminProductList({ variant = "all" }: { variant?: Variant }) {
  return <Suspense fallback={<div className={styles.master}><h4 className={styles.heading}>{titles[variant]}</h4><p>Loading...</p></div>}>
    <ListingFromUrl variant={variant} />
  </Suspense>;
}
