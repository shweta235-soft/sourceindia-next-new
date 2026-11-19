"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { leadDate } from "@/lib/adminEnquiries";
import CatalogDateFilter from "./CatalogDateFilter";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";

type Row = Record<string, unknown> & { id: string | number };
type ListResponse = { data: Row[]; totalRecords: number; filteredRecords: number };
type Column = [field: string, label: string];
type Parent = [field: string, label: string];
type Master = {
  title: string;
  formTitle: string;
  endpoint: string;
  route: string;
  deletedRoute: string;
  columns: Column[];
  parents: Parent[];
  excludeFlags: string[];
  top?: boolean;
  dateFilter?: boolean;
  importItems?: boolean;
  imageLabel?: string;
  section?: string;
  topLabel?: string;
  omitImage?: boolean;
  details?: boolean;
  lookup?: { field: string; label: string; path: string; nameField?: string; optional?: boolean };
  serialSort?: string;
  unsortable?: string[];
  editDialog?: boolean;
  exportTitle?: string;
  listTitle?: string;
};
const category: Parent = ["category_id", "Category"];
const subCategory: Parent = ["subcategory_id", "Sub Category"];
const itemCategory: Parent = ["item_category_id", "Item Category"];
const itemSubCategory: Parent = ["item_sub_category_id", "Item Sub Category"];
const masters: Record<string, Master> = {
  category: {
    title: "Category", formTitle: "Product Category", endpoint: "categories",
    route: "product_categories", deletedRoute: "category-remove-list",
    columns: [["product_count", "Product"]], parents: [],
    excludeFlags: ["excludeSellerCategories", "excludeProductCategories"], top: true, dateFilter: true,
  },
  subCategory: {
    title: "Sub Category", formTitle: "Sub Category", endpoint: "sub_categories",
    route: "product_sub_categories", deletedRoute: "subcategory-remove-list",
    columns: [["category_name", "Category"]], parents: [category],
    excludeFlags: ["excludeSellerSubCategories", "excludeProductSubCategories"], dateFilter: true,
  },
  itemCategory: {
    title: "Item Category", formTitle: "Item Category", endpoint: "item_category",
    route: "item_category", deletedRoute: "item-category-remove-list",
    columns: [["category_name", "Category"], ["subcategory_name", "Sub Category"]],
    parents: [category, subCategory], excludeFlags: ["excludeItemCategories"], importItems: true,
  },
  itemSubCategory: {
    title: "Item Sub Category", formTitle: "Item Sub Category", endpoint: "item_sub_category",
    route: "item_sub_category", deletedRoute: "item-sub-category-remove-list",
    columns: [["itemcategory_name", "Item Category"]],
    parents: [category, subCategory, itemCategory], excludeFlags: ["excludeItemSubCategories"],
  },
  items: {
    title: "Items", formTitle: "Items", endpoint: "items",
    route: "new_items", deletedRoute: "items-remove-list",
    columns: [["itemcategory_name", "Item Category"], ["item_subcategory_name", "Item Sub Category"]],
    parents: [category, subCategory, itemCategory, itemSubCategory], excludeFlags: ["excludeItem"],
    imageLabel: "Item Sub Category Image",
  },
  coreActivity: {
    title: "Core Activity", formTitle: "Core Activity", section: "Activities", endpoint: "core_activities",
    route: "core_activity", deletedRoute: "coreactivity-remove-list", columns: [], parents: [], excludeFlags: [],
    dateFilter: true, details: true,
    lookup: { field: "color", label: "Color", path: "core_activities/colors", nameField: "title", optional: true },
  },
  activity: {
    title: "Activity", formTitle: "Activity", section: "Activities", endpoint: "activities",
    route: "activity", deletedRoute: "activity-remove-list", columns: [["coreactivity_name", "Core Activity"]], parents: [], excludeFlags: [],
    dateFilter: true, omitImage: true,
    lookup: { field: "coreactivity", label: "Core Activity", path: "core_activities?is_delete=0" },
  },
  application: {
    title: "Application", formTitle: "Application", section: "Application", endpoint: "applications",
    route: "applications", deletedRoute: "application-remove-list", columns: [["product_count", "Product"]], parents: [], excludeFlags: [],
    dateFilter: true, details: true, top: true, topLabel: "Top Application", serialSort: "application_id", unsortable: ["product_count"],
  },
  interest: {
    title: "Interest Categories", formTitle: "Interest Category", listTitle: "Interest Category",
    endpoint: "interest_categories", route: "interest_categories", deletedRoute: "",
    columns: [["color_name", "Color"], ["created_at", "Created At"], ["updated_at", "Updated At"]],
    parents: [], excludeFlags: [], omitImage: true, details: true, editDialog: true,
    lookup: { field: "color", label: "Color", path: "core_activities/colors", nameField: "title", optional: true },
  },
  sourceInterest: {
    title: "Interest Category", formTitle: "source interest category", listTitle: "Source interest category", exportTitle: "Interest SubCategory Export.xlsx",
    endpoint: "interest_sub_categories", route: "source_interest_categories", deletedRoute: "",
    columns: [["category_name", "Interest Category"]], parents: [], excludeFlags: [], omitImage: true,
    lookup: { field: "interest_category_id", label: "Interest Category", path: "interest_categories" },
  },
};

const label = (value: unknown) => value == null ? "" : String(value);
const optionsFrom = (response: Row[] | { data?: Row[] }) => Array.isArray(response) ? response : response.data ?? [];

function ParentSelect({ field, title, endpoint, value, onChange, nameField = "name", optional = false }: {
  field: string; title: string; endpoint: string; value: string; onChange: (value: string) => void; nameField?: string; optional?: boolean;
}) {
  const [result, setResult] = useState<{ endpoint: string; rows: Row[]; error?: boolean }>();
  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController();
    apiFetch<Row[] | { data?: Row[] }>(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ endpoint, rows: optionsFrom(response) });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ endpoint, rows: [], error: true });
      });
    return () => controller.abort();
  }, [endpoint]);
  const rows = result?.endpoint === endpoint ? result.rows : [];
  return (
    <div className="mb-3">
      <label htmlFor={field} className={`form-label${optional ? "" : " required"}`}>{title}</label>
      <select id={field} className="form-select" value={value} onChange={(event) => onChange(event.target.value)} disabled={!endpoint}>
        <option value="">Select {title}</option>
        {value && !rows.some((row) => String(row.id) === value) && <option value={value}>{value}</option>}
        {rows.map((row) => <option key={row.id} value={row.id}>{label(row[nameField])}</option>)}
      </select>
      {result?.endpoint === endpoint && result.error && <small role="status">Options could not be loaded.</small>}
    </div>
  );
}

function CatalogForm({ master, row, reset }: { master: Master; row?: Row; reset: () => void }) {
  const [values, setValues] = useState(() => Object.fromEntries(master.parents.map(([field]) => [field, label(row?.[field])])));
  const [lookupValue, setLookupValue] = useState(label(master.lookup && row?.[master.lookup.field]));
  const [imagePreview, setImagePreview] = useState("");
  const objectUrl = useRef("");
  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);
  const cat = encodeURIComponent(values.category_id ?? "");
  const sub = encodeURIComponent(values.subcategory_id ?? "");
  const item = encodeURIComponent(values.item_category_id ?? "");
  const endpoints = [
    "categories?is_delete=0&status=1",
    cat && `sub_categories/category/${cat}`,
    cat && sub && `item_category/by-category-subcategory/${cat}/${sub}`,
    cat && sub && item && `item_sub_category/by-category-subcategory-itemcategory/${cat}/${sub}/${item}`,
  ];
  const status = (
    <div className="mb-3">
      <label className="form-label required" htmlFor="catalog-status">Status</label>
      <select id="catalog-status" className="form-select" defaultValue={label(row?.status ?? 1)}>
        <option value="1">Active</option><option value="0">Inactive</option>
      </select>
    </div>
  );

  return (
    <div className="card"><div className="card-body">
      <h5 className="card-title mb-3">{row ? "Edit" : "Add"} {master.formTitle}</h5>
      <form onSubmit={(event) => event.preventDefault()}>
        <div className="mb-3">
          <label className="form-label required" htmlFor="catalog-name">Name</label>
          <input id="catalog-name" className="form-control" defaultValue={label(row?.name)} />
        </div>
        {master.parents.map(([field, title], index) => (
          <ParentSelect key={field} field={field} title={title} endpoint={endpoints[index]} value={values[field]}
            onChange={(value) => setValues((previous) => Object.fromEntries(master.parents.map(([key], position) => [
              key, position < index ? previous[key] : position === index ? value : "",
            ])))} />
        ))}
        {master.lookup && <ParentSelect field={master.lookup.field} title={master.lookup.label} endpoint={master.lookup.path}
          value={lookupValue} nameField={master.lookup.nameField} optional={master.lookup.optional} onChange={setLookupValue} />}
        {master.topLabel && status}
        {master.top && <div className="mb-3">
          <label className="form-label" htmlFor="catalog-top">{master.topLabel ?? "Top Category"}</label>
          <select id="catalog-top" className="form-select" defaultValue={label(row?.top_category ?? 0)}>
            <option value="1">Yes</option><option value="0">No</option>
          </select>
        </div>}
        {!master.imageLabel && !master.topLabel && status}
        {(!master.omitImage || master.editDialog) && <div className="mb-3">
          <label className="form-label" htmlFor="catalog-image">{master.imageLabel ?? `${master.editDialog ? master.formTitle : master.title} Image`}</label>
          <input id="catalog-image" type="file" className="form-control" accept="image/*" onChange={master.details ? (event) => {
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
            const file = event.target.files?.[0];
            objectUrl.current = file ? URL.createObjectURL(file) : "";
            setImagePreview(objectUrl.current);
          } : undefined} />
          {master.details && (imagePreview || row?.file_name) ? <img src={imagePreview || assetUrl(label(row?.file_name))}
            width={150} height={150} className={`mt-3 ${styles.image}`} alt="Image preview" /> : null}
        </div>}
        {master.imageLabel && status}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled>{row ? "Update" : "Save"}</button>
          <button type="button" className="btn btn-secondary" onClick={reset}>Cancel</button>
        </div>
      </form>
    </div></div>
  );
}

export default function CatalogMaster({ kind, deleted = false }: { kind: string; deleted?: boolean }) {
  const master = masters[kind];
  const title = deleted ? `Recently Deleted ${master.title}` : master.title;
  const columns = deleted && master.top && !master.topLabel ? [] : master.columns;
  const hasSelection = !deleted && !master.editDialog;
  const serialSort = master.serialSort ?? "id";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: serialSort, direction: "DESC" });
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [result, setResult] = useState<{ key: string; payload?: ListResponse; error?: boolean }>();
  const [selected, setSelected] = useState<Set<Row["id"]>>(new Set());
  const [editing, setEditing] = useState<Row>();
  const [detailStatus, setDetailStatus] = useState<"loading" | "error">();
  const detailRequest = useRef<AbortController | undefined>(undefined);
  const formDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => () => detailRequest.current?.abort(), []);
  const [formKey, setFormKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const filters = new URLSearchParams(master.deletedRoute ? { getDeleted: String(deleted) } : {});
  for (const key of master.excludeFlags) filters.set(key, "false");
  if (dates.startDate && dates.endDate) {
    filters.set("dateRange", "customrange");
    filters.set("startDate", dates.startDate);
    filters.set("endDate", dates.endDate);
  }
  const filterQuery = filters.toString();
  const query = new URLSearchParams({ page: String(page), limit: String(limit), search, sortBy: sort.field, sort: sort.direction });
  const request = `${master.endpoint}/server-side?${query}${filterQuery ? `&${filterQuery}` : ""}`;
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<ListResponse>(request, { signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted) setResult({ key: request, payload });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: request, error: true });
      });
    return () => controller.abort();
  }, [request]);

  const current = result?.key === request ? result : undefined;
  const rows = Array.isArray(current?.payload?.data) ? current.payload.data : [];
  const total = Number(current?.payload?.totalRecords ?? 0);
  const filtered = Number(current?.payload?.filteredRecords ?? total);
  const pages = Math.ceil(filtered / limit);
  const firstPage = Math.max(1, Math.min(page - 2, pages - 4));
  const someRows = rows.length > 0;
  const allChecked = someRows && rows.every(({ id }) => selected.has(id));
  const changeSort = (field: string) => {
    setPage(1);
    setSort((previous) => ({ field, direction: previous.field === field && previous.direction === "ASC" ? "DESC" : "ASC" }));
  };
  function openForm(row?: Row) {
    detailRequest.current?.abort();
    setEditing(row);
    setFormKey((value) => value + 1);
    setDetailStatus(undefined);
    if (row && master.editDialog && !formDialog.current?.open) formDialog.current?.showModal();
    if (!row || !master.details) return;
    const controller = new AbortController();
    detailRequest.current = controller;
    setDetailStatus("loading");
    apiFetch<Row>(`${master.endpoint}/${encodeURIComponent(row.id)}`, { signal: controller.signal }).then((detail) => {
      if (controller.signal.aborted) return;
      setEditing({ ...row, ...detail });
      setFormKey((value) => value + 1);
      setDetailStatus(undefined);
    }).catch(() => { if (!controller.signal.aborted) setDetailStatus("error"); });
  }
  async function exportRows() {
    setExporting(true);
    setExportError(false);
    try {
      if (master.section || master.exportTitle) {
        const response = await apiFetch<Row[] | { data?: Row[] }>(master.endpoint);
        const records = optionsFrom(response).filter((row) => !master.deletedRoute || Number(row.is_delete) === Number(deleted)).map((row) => ({
          ...row, getStatus: label(row.getStatus) || (Number(row.status) === 1 ? "Active" : "Inactive"),
          created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
        }));
        downloadAdminWorkbook(records, [
          ["Name", "name"], ...columns.filter(([field]) => field === "coreactivity_name" || field === "category_name").map(([field, heading]): Column => [heading, field]),
          ["Status", "getStatus"], ["Created", "created_at"], ["Last Update", "updated_at"],
        ], master.exportTitle ?? `${master.title}${deleted ? " Remove" : ""} Export.xlsx`);
        return;
      }
      const records = await apiFetch<Row[] | { data?: Row[] }>(`${master.endpoint}?${filterQuery}`);
      downloadAdminWorkbook(optionsFrom(records), [
        ["ID", "id"], ["Name", "name"], ...columns.map(([field, title]): Column => [title, field]), ["Status", "status"],
      ], `${title} Export.xlsx`);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }
  const sortable = (field: string, text: string) => (
    <th key={field} scope="col" aria-sort={sort.field === field ? sort.direction === "ASC" ? "ascending" : "descending" : undefined}>
      <button className={styles.sort} type="button" onClick={() => changeSort(field)}>
        {text}<span aria-hidden="true">{sort.field === field ? sort.direction === "ASC" ? "↑" : "↓" : "↕"}</span>
      </button>
    </th>
  );

  const formContent = <>
    {detailStatus === "error" && <p role="alert">Record details could not be loaded.</p>}
    {detailStatus === "loading" ? <div className="card"><div className="card-body" role="status">Loading record details...</div></div> :
      <CatalogForm key={formKey} master={master} row={editing} reset={() => {
        if (master.editDialog) formDialog.current?.close();
        else openForm();
      }} />}
  </>;

  return (
    <div className={styles.master}>
      <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
        <div>
          <h4 className={`mb-1 ${styles.heading}`}>{master.title} {total > 0 && <span className={`badge ms-2 ${styles.count}`}>{total}</span>}</h4>
          <nav aria-label="breadcrumb" className="page-breadcrumb mb-3 d-none d-sm-block">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
              <li className="breadcrumb-item">{master.section ?? "Category Master"}</li>
              <li className="breadcrumb-item active" aria-current="page">{master.listTitle ?? (master.section && !deleted ? `${title} List` : title)}</li>
            </ol>
          </nav>
        </div>
        {!master.editDialog && <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
          <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={() => void exportRows()}>
            <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
          </button>
          {!deleted && <button className="btn btn-sm btn-danger" type="button" disabled><i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected</button>}
          {master.deletedRoute && <Link className="btn btn-sm btn-primary" href={`/admin/${deleted ? master.route : master.deletedRoute}`}>
            {deleted ? "Back" : `Recently Deleted ${master.title}`}
          </Link>}
          {!deleted && <button className="btn btn-primary" type="button" onClick={() => openForm()}>
            <i className="bx bxs-plus-square me-1" aria-hidden="true" />Add {master.exportTitle ? master.formTitle : master.title}
          </button>}
        </div>}
      </div>
      {exportError && <p className="alert alert-danger" role="alert">The Excel export could not be loaded.</p>}
      <div className="row gy-3">
        {!deleted && !master.editDialog && <div className="col-md-4">{formContent}</div>}
        {master.editDialog && <dialog ref={formDialog} className={styles.editDialog} aria-label={`Edit ${master.formTitle}`}
          onClose={() => openForm()}>
          <button type="button" className="btn-close position-absolute top-0 end-0 m-3 z-1" aria-label="Close" onClick={() => formDialog.current?.close()} />
          {editing && formContent}
        </dialog>}
        <div className={deleted || master.editDialog ? "col-12" : "col-md-8"}>
          {deleted && <div className="card mb-3"><div className="card-body">
            <h5 className="card-title mb-2">{title} List</h5>
            {master.section && master.dateFilter ? <CatalogDateFilter dates={dates} apply={(nextDates) => {
              setDates(nextDates);
              setPage(1);
            }} /> : master.dateFilter && <>
              <button type="button" className="btn btn-outline-secondary btn-sm" aria-expanded={dateFilterOpen} onClick={() => setDateFilterOpen((value) => !value)}>
                <i className="bx bx-calendar me-2" aria-hidden="true" />{dates.startDate ? `${dates.startDate} to ${dates.endDate}` : "Date Filter"}
              </button>
              {dateFilterOpen && <form className="d-flex gap-2 align-items-end flex-wrap mt-2" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setDates({ startDate: label(form.get("startDate")), endDate: label(form.get("endDate")) });
                setPage(1);
                setDateFilterOpen(false);
              }}>
                <label>Start date<input name="startDate" type="date" className="form-control" defaultValue={dates.startDate} required /></label>
                <label>End date<input name="endDate" type="date" className="form-control" defaultValue={dates.endDate} required /></label>
                <button className="btn btn-primary" type="submit">Apply</button>
                <button className="btn btn-secondary" type="button" onClick={() => {
                  setDates({ startDate: "", endDate: "" }); setPage(1); setDateFilterOpen(false);
                }}>Clear</button>
              </form>}
            </>}
          </div></div>}
          <div className="card"><div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 border-bottom pb-4 mt-2">
              <label className="d-flex gap-2 align-items-center">
                <select className="form-select form-select-sm w-auto" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                  {[25, 50, 100].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>entries per page
              </label>
              <label className="d-flex gap-2 align-items-center">Search:
                <input className={`form-control form-control-sm ${styles.search}`} value={search} placeholder="Search..." onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
              </label>
            </div>
            <div className="table-responsive border rounded-2 mt-4">
              <table className="table table-striped table-hover align-middle dataTable mb-0">
                <thead><tr>
                  {hasSelection && <th scope="col"><input type="checkbox" aria-label="Select all rows on page" disabled={!someRows} checked={allChecked}
                    onChange={(event) => setSelected((previous) => {
                      const next = new Set(previous);
                      for (const { id } of rows) { if (event.target.checked) next.add(id); else next.delete(id); }
                      return next;
                    })} /></th>}
                  {sortable(serialSort, "S.No.")}
                  {!master.omitImage && <th scope="col">Image</th>}
                  {sortable("name", "Name")}
                  {columns.map(([field, title]) => master.unsortable?.includes(field)
                    ? <th key={field} scope="col">{title}</th> : sortable(field, title))}
                  <th scope="col">Status</th>
                  {master.top && <th scope="col">Top</th>}
                  <th scope="col">Action</th>
                </tr></thead>
                <tbody>
                  {!someRows && <tr><td colSpan={4 + columns.length + Number(!master.omitImage) + Number(hasSelection) + Number(Boolean(master.top))} className="text-center">
                    {current?.error ? "Records could not be loaded." : current ? "No matching records found" : "Loading..."}
                  </td></tr>}
                  {rows.map((row, index) => <tr key={row.id}>
                    {hasSelection && <td><input type="checkbox" aria-label={`Select ${label(row.name)}`} checked={selected.has(row.id)}
                      onChange={(event) => setSelected((previous) => {
                        const next = new Set(previous);
                        if (event.target.checked) next.add(row.id); else next.delete(row.id);
                        return next;
                      })} /></td>}
                    <td>{(page - 1) * limit + index + 1}</td>
                    {!master.omitImage && <td><img className={styles.image} src={assetUrl(label(row.file_name))} width="50" height="50" loading="lazy" alt=""
                      onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} /></td>}
                    <td>{label(row.name)}</td>
                    {columns.map(([field]) => <td key={field}>{field.endsWith("_at") ? leadDate(row[field]) : label(row[field])}</td>)}
                    {[["status", "Status"], ...(master.top ? [["top_category", "Top"]] : [])].map(([field, name]) => <td key={field}>
                      {deleted ? <span className={`badge bg-${Number(row[field]) === 1 ? "success" : "danger"}`}>
                        {field === "status" ? Number(row[field]) === 1 ? "Active" : "Inactive" : Number(row[field]) === 1 ? "Yes" : "No"}
                      </span> :
                        <div className="form-check form-switch"><input type="checkbox" className="form-check-input" checked={Number(row[field]) === 1} aria-label={`${name} for ${label(row.name)}`} disabled /></div>}
                    </td>)}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {!deleted && master.importItems && <button className="btn btn-sm btn-success" aria-label="Import item sub categories" type="button" disabled><i className="bx bx-upload" /></button>}
                        <div className="dropdown">
                          <button className="btn btn-sm btn-light" aria-label={`Actions for ${label(row.name)}`} type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
                          </button>
                          <ul className="dropdown-menu">
                            {!deleted && <li><button className="dropdown-item" type="button" onClick={() => openForm(row)}><i className="bx bx-edit me-2" />Edit</button></li>}
                            <li><button className="dropdown-item" type="button" disabled><i className={`bx ${deleted ? "bx-undo" : "bx-trash"} me-2`} />{deleted ? "Restore" : "Delete"}</button></li>
                            {deleted && master.section && <li><button className="dropdown-item text-danger" type="button" disabled><i className="bx bx-trash me-2" />Delete</button></li>}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center mt-4">
              <span>Showing {someRows ? (page - 1) * limit + 1 : 0} to {someRows ? (page - 1) * limit + rows.length : 0} of {filtered} entries{filtered < total ? ` (filtered from ${total} total entries)` : ""}</span>
              <nav className="btn-group btn-group-sm" aria-label="Table pages">
                <button className="btn btn-outline-secondary" type="button" disabled={!current || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                {Array.from({ length: Math.min(5, pages) }, (_, index) => firstPage + index).map((number) =>
                  <button type="button" key={number} className={`btn ${number === page ? "btn-primary" : "btn-outline-secondary"}`} aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
                <button className="btn btn-outline-secondary" type="button" disabled={!current || page >= pages} onClick={() => setPage(page + 1)}>Next</button>
              </nav>
            </div>
          </div></div>
        </div>
      </div>
    </div>
  );
}
