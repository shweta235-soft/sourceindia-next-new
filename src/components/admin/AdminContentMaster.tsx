"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { ProductSelect, text } from "./ProductFields";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";

type Kind = "faq" | "faqCategory" | "knowledge" | "banner" | "testimonial";
type Row = Record<string, unknown> & { id: string | number };
type Response = { data: Row[]; totalRecords: number; filteredRecords: number };
type Column = [field: string, heading: string];
type Dates = { startDate: string; endDate: string };

const emptyDates: Dates = { startDate: "", endDate: "" };
const masters = {
  faq: {
    heading: "FAQ", section: "FAQ", singular: "FAQ", endpoint: "faqs",
    route: "faqs", deletedRoute: "faq-remove-list",
    columns: [["title", "Title"], ["category_name", "Category"]],
    exportName: "Faq",
  },
  faqCategory: {
    heading: "FAQ Categories", section: "FAQ", singular: "FAQ Category", endpoint: "faq_categories",
    route: "faq_categories", deletedRoute: "",
    columns: [["name", "Name"], ["created_at", "Created At"], ["updated_at", "Updated At"]],
    exportName: "",
  },
  knowledge: {
    heading: "Knowledge Center", section: "Knowledge Center", singular: "Knowledge Center", endpoint: "knowledge_center",
    route: "knowledge_center", deletedRoute: "knowledgecenter-remove-list",
    columns: [["image", "Image"], ["name", "Name"]],
    exportName: "Knowledge Center",
  },
  banner: {
    heading: "Home Banner", section: "Home Banner", singular: "Home Banner", endpoint: "home_banners",
    route: "home_banners", deletedRoute: "homebanner-remove-list",
    columns: [["image", "Image"], ["title", "Title"], ["button_text", "Button Text"]],
    exportName: "Home Banner",
  },
  testimonial: {
    heading: "Testimonials", section: "Testimonial", singular: "Testimonial", endpoint: "testimonials",
    route: "testimonials", deletedRoute: "",
    columns: [["image", "Image"], ["name", "Name"], ["description", "Description"]],
    exportName: "",
  },
} satisfies Record<Kind, {
  heading: string; section: string; singular: string; endpoint: string;
  route: string; deletedRoute: string; columns: Column[]; exportName: string;
}>;

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(text(value));
  if (!Number.isFinite(date.getTime())) return text(value);
  return `${date.toLocaleDateString("sv-SE")} ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function ContentImage({ file, preview, size, testimonialImageId }: { file: unknown; preview?: string; size: number; testimonialImageId?: unknown }) {
  const localImage = testimonialImageId && /^[1-9]\d*$/.test(text(testimonialImageId)) && /^upload\/testimonials\//.test(text(file))
    ? `/admin/api/local/testimonials/images/${encodeURIComponent(text(testimonialImageId))}` : null;
  return <img src={preview || localImage || assetUrl(text(file))} alt="" width={size} height={size}
    className={styles.image} loading="lazy" onError={(event) => {
      if (localImage && event.currentTarget.src.includes("/admin/api/local/testimonials/images/")) { event.currentTarget.src = assetUrl(text(file)); return; }
      if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png";
    }} />;
}

function ContentForm({ kind, row, reset }: { kind: Kind; row?: Row; reset: () => void }) {
  const [category, setCategory] = useState(text(row?.category));
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const mainField = kind === "faq" || kind === "banner" ? "title" : "name";
  const hasDescription = kind === "faq" || kind === "banner" || kind === "testimonial";
  const hasImage = kind === "knowledge" || kind === "banner" || kind === "testimonial";
  const description = text(row?.description);
  const visibleDescription = kind === "testimonial" ? description :
    description.replace(/<br\s*\/?\s*>|<\/p\s*>/gi, "\n").replace(/<[^>]*>/g, "").trim();
  const title = `${row ? "Edit" : "Add"} ${masters[kind].singular}`;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <form onSubmit={(event) => event.preventDefault()}>
    <h5 className="card-title mb-3">{title}</h5>
    <div className="mb-3">
      <label htmlFor="content-name" className="form-label required">{mainField === "title" ? "Title" : "Name"}</label>
      <input id="content-name" className="form-control" defaultValue={text(row?.[mainField])} required />
    </div>
    {kind === "banner" && <div className="mb-3">
      <label htmlFor="content-sub-title" className="form-label required">Sub Title</label>
      <input id="content-sub-title" className="form-control" defaultValue={text(row?.sub_title)} required />
    </div>}
    {hasDescription && <div className="mb-3">
      <label htmlFor="content-description" className="form-label required">Description</label>
      <textarea id="content-description" className="form-control" rows={kind === "testimonial" ? 2 : 5}
        placeholder={kind === "testimonial" ? "Description" : undefined} required defaultValue={visibleDescription} />
    </div>}
    {kind === "banner" && ([["button_text", "Button Text"], ["button_url", "Button Url"]] as const).map(([field, label]) =>
      <div className="mb-3" key={field}>
        <label htmlFor={`content-${field}`} className="form-label required">{label}</label>
        <input id={`content-${field}`} className="form-control" defaultValue={text(row?.[field])} required />
      </div>)}
    {kind === "faq" && <div className="mb-3"><ProductSelect label="Category" endpoint="faq_categories" value={category}
      onChange={setCategory} emptyLabel="Select Category" required /></div>}
    {kind === "knowledge" && <div className="mb-3">
      <label htmlFor="content-video" className="form-label required">Video Url</label>
      <input id="content-video" className="form-control" type="url" defaultValue={text(row?.video_url)} required />
    </div>}
    <div className="mb-3">
      <label htmlFor="content-status" className="form-label required">Status</label>
      <select id="content-status" className="form-select" defaultValue={text(row?.status ?? 1)} required>
        <option value="1">Active</option><option value="0">Inactive</option>
      </select>
    </div>
    {hasImage && <div className="mb-3">
      <label htmlFor="content-file" className={`form-label${kind === "knowledge" ? "" : " required"}`}>
        {kind === "knowledge" ? "Image" : `${masters[kind].singular} Image`}
      </label>
      <input id="content-file" type="file" accept="image/*" className="form-control" onChange={(event) => {
        setPreview("");
        setFile(event.target.files?.[0]);
      }} />
      {(preview || row?.file_name) ? <div className="mt-3"><ContentImage file={row?.file_name} preview={preview} size={150} testimonialImageId={kind === "testimonial" ? row?.file_id : undefined} /></div> : null}
    </div>}
    <div className="d-flex justify-content-between">
      <button className="btn btn-sm btn-secondary" type="button" onClick={reset}>{row ? "Cancel" : "Reset"}</button>
      <button className="btn btn-sm btn-primary" type="submit" disabled>{row ? "Update" : "Save"}</button>
    </div>
  </form>;
}

function CategoryEditDialog({ row, close }: { row: Row; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="rounded border-0 p-4 w-auto" aria-label="Edit FAQ Category" onClose={close}>
    <ContentForm kind="faqCategory" row={row} reset={close} />
  </dialog>;
}

function DeletedFilters({ title, dates, apply }: { title: string; dates: Dates; apply: (dates: Dates) => void }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(dates.startDate);
  const [end, setEnd] = useState(dates.endDate);
  return <div className="card mb-3"><div className="card-body">
    <h5 className="card-title mb-3">{title} List</h5>
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <span className="form-label mb-0">Date Filter:</span>
      <button type="button" className="btn btn-outline-secondary" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i className="bx bx-calendar me-2" aria-hidden="true" />{dates.startDate ? `${dates.startDate} - ${dates.endDate}` : "Select Date Range"}
      </button>
    </div>
    {open && <form onSubmit={(event) => {
      event.preventDefault(); apply({ startDate: start, endDate: end }); setOpen(false);
    }} className="d-flex align-items-end flex-wrap gap-2 mt-3">
      <label>Start date<input className="form-control" type="date" value={start}
        max={end || undefined} required onChange={(event) => setStart(event.target.value)} /></label>
      <label>End date<input className="form-control" type="date" value={end}
        min={start || undefined} required onChange={(event) => setEnd(event.target.value)} /></label>
      <button className="btn btn-primary" type="submit">Apply</button>
      <button className="btn btn-secondary" type="button" onClick={() => {
        setStart(""); setEnd(""); apply(emptyDates); setOpen(false);
      }}>Clear</button>
    </form>}
  </div></div>;
}

export default function AdminContentMaster({ kind, deleted = false }: { kind: Kind; deleted?: boolean }) {
  const config = masters[kind];
  const categoryList = kind === "faqCategory";
  const hasForm = !deleted && !categoryList;
  const hasSelection = hasForm && Boolean(config.deletedRoute);
  const title = deleted ? `Recently Deleted ${config.singular}` : categoryList ? config.singular : `${config.singular} List`;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "id", direction: "DESC" });
  const [dates, setDates] = useState(emptyDates);
  const [state, setState] = useState<{ query: string; response?: Response; error?: boolean }>();
  const [selected, setSelected] = useState<Set<Row["id"]>>(new Set());
  const [editing, setEditing] = useState<Row>();
  const [formKey, setFormKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const query = new URLSearchParams({
    page: String(page), limit: String(limit), search, sortBy: sort.field, sort: sort.direction,
  });
  if (config.deletedRoute) query.set("getDeleted", String(deleted));
  if (dates.startDate && dates.endDate) {
    query.set("dateRange", "customrange");
    query.set("startDate", dates.startDate);
    query.set("endDate", dates.endDate);
  }

  const request = `${config.endpoint}/server-side?${query}`;
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<Response>(request, { signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response?.data)) throw new Error("Invalid list response");
        if (!controller.signal.aborted) setState({ query: request, response });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ query: request, error: true });
      });
    return () => controller.abort();
  }, [request]);

  const current = state?.query === request ? state : undefined;
  const rows = current?.response?.data ?? [];
  const total = current?.response?.totalRecords ?? 0;
  const filtered = current?.response?.filteredRecords ?? total;
  const pages = Math.ceil(filtered / limit);
  const firstPage = Math.max(1, Math.min(page - 2, pages - 4));

  function openForm(row?: Row) {
    setEditing(row);
    setFormKey((value) => value + 1);
  }

  function select(ids: Row["id"][], checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of ids) checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function exportRows() {
    setExporting(true);
    setExportError(false);
    try {
      const batchSize = 500;
      const exportQuery = new URLSearchParams(query);
      exportQuery.set("limit", String(batchSize));
      const allRows: Row[] = [];
      let records = 0;
      for (let batch = 1; batch === 1 || (batch - 1) * batchSize < records; batch++) {
        exportQuery.set("page", String(batch));
        const result = await apiFetch<Response>(`${config.endpoint}/server-side?${exportQuery}`);
        if (batch === 1) records = result.filteredRecords;
        allRows.push(...result.data);
        if (result.data.length < batchSize) break;
      }
      const fields: Column[] = [
        [kind === "banner" ? "Title" : "Name", kind === "faq" || kind === "banner" ? "title" : "name"],
        ...(kind === "faq" ? [["Category", "category_name"] as Column] : []),
        ...(kind === "banner" ? [["Image", "file_id"], ["Button Text", "button_text"]] as Column[] : []),
        ["Status", "status"], ["Created", "created_at"], ["Last Update", "updated_at"],
      ];
      downloadAdminWorkbook(allRows.map((row) => ({
        ...row, status: Number(row.status) === 1 ? "Active" : "Inactive",
        created_at: formatDate(row.created_at), updated_at: formatDate(row.updated_at),
      })), fields, `${config.exportName}${deleted ? " Remove" : ""} Export.xlsx`);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  function sortable(field: string, label: string) {
    const active = sort.field === field;
    return <th scope="col" key={field} aria-sort={active ? sort.direction === "ASC" ? "ascending" : "descending" : undefined}>
      <button className={styles.sort} type="button" onClick={() => {
        setSort({ field, direction: active && sort.direction === "ASC" ? "DESC" : "ASC" });
        setPage(1);
      }}>{label}<span aria-hidden="true">{active ? sort.direction === "ASC" ? "↑" : "↓" : "↕"}</span></button>
    </th>;
  }

  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
      <div>
        <h4 className={`mb-1 ${styles.heading}`}>{config.heading}{total > 0 && <span className={`badge ms-2 ${styles.count}`}>{total}</span>}</h4>
        <nav className="page-breadcrumb mb-3 d-none d-sm-block" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link href="/admin/dashboard">Home</Link></li>
            <li className="breadcrumb-item">{config.section}</li>
            <li className="breadcrumb-item active" aria-current="page">{title}</li>
          </ol>
        </nav>
      </div>
      {!categoryList && <div className="d-flex flex-wrap gap-2 mb-2">
        {config.exportName && <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={() => void exportRows()}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>}
        {hasSelection && <button className="btn btn-sm btn-danger" type="button" disabled>
          <i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected
        </button>}
        {config.deletedRoute && <Link className="btn btn-sm btn-primary" href={`/admin/${deleted ? config.route : config.deletedRoute}`}>
          {deleted ? "Back" : `Recently Deleted ${config.singular}`}
        </Link>}
        {hasForm && <button className="btn btn-primary" type="button" onClick={() => openForm()}>
          <i className="bx bxs-plus-square me-1" aria-hidden="true" />Add {config.singular}
        </button>}
      </div>}
    </div>
    {exportError && <p className="alert alert-danger" role="alert">Excel export could not be loaded.</p>}
    <div className="row gy-3">
      {hasForm && <div className="col-md-4"><div className="card"><div className="card-body">
        <ContentForm key={formKey} kind={kind} row={editing} reset={() => openForm()} />
      </div></div></div>}
      <div className={hasForm ? "col-md-8" : "col-12"}>
        {deleted && <DeletedFilters title={title} dates={dates} apply={(range) => { setPage(1); setDates(range); }} />}
        <div className="card"><div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 border-bottom pb-4 mt-2">
            <label className="d-flex gap-2 align-items-center">
              <select className="form-select form-select-sm w-auto" value={limit} aria-label="Entries per page"
                onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                {[25, 50, 100].map((size) => <option key={size}>{size}</option>)}
              </select>entries per page
            </label>
            <label className="d-flex gap-2 align-items-center">Search:
              <input className={`form-control form-control-sm ${styles.search}`} placeholder="Search..." value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            </label>
          </div>
          <div className="table-responsive border rounded-2 mt-4">
            <table className="table table-striped table-hover align-middle dataTable mb-0">
              <thead><tr>
                {hasSelection && <th scope="col">
                  <input type="checkbox" aria-label="Select all records on page" disabled={!rows.length}
                    checked={rows.length > 0 && rows.every(({ id }) => selected.has(id))}
                    onChange={(event) => select(rows.map(({ id }) => id), event.target.checked)} />
                </th>}
                {sortable("id", "S.No.")}
                {config.columns.map(([field, heading]) => field === "image" ? <th scope="col" key={field}>{heading}</th> : sortable(field, heading))}
                <th scope="col">Status</th><th scope="col">Action</th>
              </tr></thead>
              <tbody>
                {!rows.length && <tr><td className="text-center" colSpan={config.columns.length + 3 + Number(hasSelection)}>
                  {current?.error ? "Records could not be loaded." : current ? "No matching records found" : "Loading..."}
                </td></tr>}
                {rows.map((row, index) => {
                  const active = Number(row.status) === 1;
                  const name = text(row.title ?? row.name ?? row.id);
                  return <tr key={row.id}>
                    {hasSelection && <td><input type="checkbox" aria-label={`Select ${name}`} checked={selected.has(row.id)}
                      onChange={(event) => select([row.id], event.target.checked)} /></td>}
                    <td>{(page - 1) * limit + index + 1}</td>
                    {config.columns.map(([field]) => {
                      let value = text(row[field]);
                      if (field.endsWith("_at")) value = formatDate(row[field]);
                      if (field === "description" && value.length > 25) value = `${value.slice(0, 25)}...`;
                      return <td key={field}>{field === "image" ? <ContentImage file={row.file_name} size={50} testimonialImageId={kind === "testimonial" ? row.file_id : undefined} /> : value}</td>;
                    })}
                    <td>{deleted ? <span className={`badge bg-${active ? "success" : "danger"}`}>{active ? "Active" : "Inactive"}</span> :
                      <div className="form-check form-switch"><input className="form-check-input" type="checkbox"
                        checked={active} disabled aria-label={`Status for ${name}`} /></div>}</td>
                    <td><div className="dropdown">
                      <button type="button" className="btn btn-sm btn-light" data-bs-toggle="dropdown" aria-expanded="false" aria-label={`Actions for ${name}`}>
                        <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
                      </button>
                      <ul className="dropdown-menu">
                        {deleted ? <li><button type="button" className="dropdown-item" disabled><i className="bx bx-windows me-2" />Restore</button></li>
                          : <li><button type="button" className="dropdown-item" onClick={() => openForm(row)}><i className="bx bx-edit me-2" />Edit</button></li>}
                        <li><button type="button" className="dropdown-item text-danger" disabled><i className="bx bx-trash me-2" />Delete</button></li>
                      </ul>
                    </div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between flex-wrap align-items-center gap-3 mt-4">
            <span>Showing {rows.length ? (page - 1) * limit + 1 : 0} to {rows.length ? (page - 1) * limit + rows.length : 0} of {filtered} entries
              {filtered < total ? ` (filtered from ${total} total entries)` : ""}</span>
            <nav className="btn-group btn-group-sm" aria-label="Table pages">
              <button className="btn btn-outline-secondary" type="button" disabled={!current || page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              {Array.from({ length: Math.min(5, pages) }, (_, index) => firstPage + index).map((number) =>
                <button className={`btn ${number === page ? "btn-primary" : "btn-outline-secondary"}`} type="button" key={number}
                  aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
              <button className="btn btn-outline-secondary" type="button" disabled={!current || page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </nav>
          </div>
        </div></div>
      </div>
    </div>
    {categoryList && editing && <CategoryEditDialog key={formKey} row={editing} close={() => openForm()} />}
  </div>;
}
