"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";
import modalStyles from "./product-keywords.module.css";

type Subcategory = { id: string; name: string };
type Panel = { type: "list" | "add"; category: Subcategory };

function KeywordDialog({ title, close, children }: { title: string; close: () => void; children: (dismiss: () => void) => ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (element.open) closeButton.current?.focus();
    else element.showModal();
  }, [title]);
  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby="keyword-dialog-title" onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog modal-lg modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="keyword-dialog-title">{title}</h5>
          <button ref={closeButton} className="btn-close" type="button" aria-label="Close" onClick={() => dialog.current?.close()} />
        </div>
        {children(() => dialog.current?.close())}
      </div>
    </div>
  </dialog>;
}

function AddKeywords({ close }: { close: () => void }) {
  const nextId = useRef(1);
  const [names, setNames] = useState([{ id: 0, value: "" }]);
  return <div className="modal-body">
    <form onSubmit={(event) => event.preventDefault()}>
      <label className="form-label required" htmlFor={`keyword-${names[0].id}`}>Name</label>
      {names.map(({ id, value }, index) => <div key={id} className="d-flex align-items-center gap-2 mb-2">
        <input id={`keyword-${id}`} aria-label={`Name ${index + 1}`} className="form-control" value={value}
          placeholder={`Name ${index + 1}`} onChange={(event) => {
            const value = event.target.value;
            setNames((previous) => previous.map((entry) => entry.id === id ? { id, value } : entry));
          }} />
        {names.length > 1 && <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Remove name ${index + 1}`}
          onClick={() => setNames((previous) => previous.filter((entry) => entry.id !== id))}><i className="bx bx-trash" aria-hidden="true" /></button>}
      </div>)}
      <button type="button" className="btn btn-sm btn-outline-primary mt-1" onClick={() => {
        const id = nextId.current++;
        setNames((previous) => [...previous, { id, value: "" }]);
      }}><i className="bx bx-plus me-1" aria-hidden="true" />Add More</button>
      <div className="d-flex justify-content-between mt-3">
        <button type="button" className="btn btn-sm btn-secondary" onClick={close}>Reset</button>
        <button type="submit" className="btn btn-sm btn-primary" disabled>Save</button>
      </div>
    </form>
  </div>;
}

function KeywordList({ category, add, close }: { category: Subcategory; add: () => void; close: () => void }) {
  const [result, setResult] = useState<{ rows?: LeadRecord[]; error?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<LeadRecord[]>(`keywords/by-subcategory/${encodeURIComponent(category.id)}`, { signal: controller.signal }).then((rows) => {
      if (!Array.isArray(rows)) throw new Error("Invalid keyword response.");
      if (!controller.signal.aborted) setResult({ rows });
    }).catch(() => { if (!controller.signal.aborted) setResult({ error: true }); });
    return () => controller.abort();
  }, [category.id, attempt]);

  const filtered = result?.rows?.filter((row) => leadText(row.name).toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  const csvName = category.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "example_keywords";

  return <>
    <div className="modal-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex flex-wrap gap-2">
          <a className="btn btn-sm btn-outline-primary" href="/example_keywords.csv" download={`${csvName}.csv`}>
            <i className="bx bx-download me-1" aria-hidden="true" />Download Example CSV
          </a>
          <button type="button" className="btn btn-sm btn-success" disabled><i className="bx bx-upload me-1" aria-hidden="true" />Import Keywords</button>
        </div>
        <input className={`form-control form-control-sm ${modalStyles.search}`} placeholder="Search keyword" aria-label="Search keyword"
          value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {!result ? <p role="status" className="text-center">Loading...</p> : result.error ?
        <p role="alert">Keywords could not be loaded. <button type="button" className="btn btn-sm btn-link"
          onClick={() => { setResult(undefined); setAttempt((value) => value + 1); }}>Retry</button></p> :
        !filtered.length ? <p className="text-muted text-center mb-0">No keywords found.</p> :
        <div className="table-responsive"><table className="table table-sm table-bordered align-middle mb-0">
          <thead><tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">Action</th></tr></thead>
          <tbody>{filtered.map((row, index) => {
            const id = leadText(row.id);
            const isMain = Number(row.is_main) === 1;
            return <tr key={id}>
              <td>{index + 1}</td>
              <td>{selected === id ? <input key={id} aria-label="Edit keyword" className="form-control form-control-sm" defaultValue={leadText(row.name)} /> : leadText(row.name)}</td>
              <td>{isMain ? <span className="badge bg-secondary text-wrap text-start">Managed by Item Subcategory</span> : selected === id ?
                <><button type="button" className="btn btn-sm btn-success me-1" aria-label="Save keyword" disabled><i className="bx bx-check" aria-hidden="true" /></button>
                <button type="button" className="btn btn-sm btn-secondary" aria-label="Cancel editing" onClick={() => setSelected(undefined)}><i className="bx bx-x" aria-hidden="true" /></button></> :
                <><button type="button" className="btn btn-sm" aria-label={`Edit ${leadText(row.name)}`} onClick={() => setSelected(id)}><i className="bx bx-edit" aria-hidden="true" /></button>
                {!(row.is_used === true || Number(row.is_used) === 1) && <button type="button" className="btn btn-sm text-danger" aria-label="Delete keyword" disabled>
                  <i className="bx bx-trash" aria-hidden="true" /></button>}</>}</td>
            </tr>;
          })}</tbody>
        </table></div>}
    </div>
    <div className="modal-footer">
      <button type="button" className="btn btn-sm btn-primary" onClick={add}><i className="bx bx-plus me-1" aria-hidden="true" />Add Keyword</button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={close}>Close</button>
    </div>
  </>;
}

export default function ProductKeywords() {
  const [panel, setPanel] = useState<Panel>();
  const [count, setCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    query.set("excludeItemSubCategories", "false");
    const result = await apiFetch<LeadListResult>(`keywords/server-side?${query}`, { signal });
    if (!Array.isArray(result?.data) || !Number.isFinite(result.totalRecords) || !Number.isFinite(result.filteredRecords)) {
      throw new Error("Product keywords could not be loaded.");
    }
    if (!signal.aborted) setCount(result.totalRecords);
    return result;
  }, []);

  async function exportRows() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await apiFetch<LeadRecord[]>("keywords?excludeItemSubCategories=false");
      if (!Array.isArray(rows)) throw new Error("Invalid keyword export.");
      downloadAdminWorkbook(rows.map((row) => ({ ...row, created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at) })), [
        ["Name", "name"], ["Item SubCategory", "item_subcategory_name"], ["ItemCategory", "itemcategory_name"], ["Status", "status"],
        ["Main", "is_main"], ["Created At", "created_at"], ["Updated At", "updated_at"],
      ], "Product Keywords.xlsx");
    } catch {
      setExportError("Excel export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  const columns: DashboardColumn[] = [
    { key: "file_name", label: "Image", sortable: false, render: (row) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={assetUrl(leadText(row.file_name))} width={50} height={50} className={styles.image} alt="" loading="lazy"
        onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} />
    ) },
    { key: "name", label: "Name", render: (row) => leadText(row.name) },
    { key: "itemcategory_name", label: "Item Category", render: (row) => leadText(row.itemcategory_name) },
    { key: "action", label: "Action", sortable: false, render: (row) => {
      const id = leadText(row.item_subcategory_id ?? row.id);
      if (!/^[1-9]\d*$/.test(id)) return null;
      const category = { id, name: leadText(row.item_subcategory_name || row.name) };
      return <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-primary" title="Add keyword for this item subcategory"
          aria-label={`Add keyword for ${category.name}`} onClick={() => setPanel({ type: "add", category })}><i className="bx bx-plus" aria-hidden="true" /></button>
        <button type="button" className="btn btn-sm btn-info" title="Keyword list"
          aria-label={`Keyword list for ${category.name}`} onClick={() => setPanel({ type: "list", category })}><i className="bx bx-list-ul" aria-hidden="true" /></button>
      </div>;
    } },
  ];

  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 className={`mb-1 ${styles.heading}`}>Product Keywords{count > 0 && <span className={`badge ms-2 ${styles.count}`}>{count}</span>}</h1>
        <ReportsBreadcrumb page="Keyword Master" title="Product Keywords" />
      </div>
      <div className="d-flex gap-2 mb-2">
        <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={() => void exportRows()}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
        <button type="button" className="btn btn-sm btn-danger" disabled><i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected</button>
      </div>
    </div>
    {exportError && <p role="alert">{exportError}</p>}
    <DashboardTable title="Product Keywords" columns={columns} load={load} hideHeading />
    {panel && <KeywordDialog key={panel.category.id}
      title={panel.type === "list" ? `Product Keywords – ${panel.category.name}` : "Add Product Keyword"}
      close={() => setPanel(undefined)}>
      {(dismiss) => panel.type === "list"
        ? <KeywordList category={panel.category} add={() => setPanel({ ...panel, type: "add" })} close={dismiss} />
        : <AddKeywords close={dismiss} />}
    </KeywordDialog>}
  </div>;
}
