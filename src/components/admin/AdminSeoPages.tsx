"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import styles from "./catalog-master.module.css";

type Keyword = { label: string; value: string };

function Keywords({ initial }: { initial: string }) {
  const id = useId();
  const [keywords, setKeywords] = useState<readonly Keyword[]>(() =>
    [...new Set(initial.split(",").map((value) => value.trim()).filter(Boolean))].map((value) => ({ label: value, value })),
  );
  const [input, setInput] = useState("");
  const add = (text: string) => {
    const values = text.split(",").map((word) => word.trim()).filter(Boolean);
    setKeywords((previous) => [...new Set([...previous.map(({ value }) => value), ...values])].map((value) => ({ label: value, value })));
    setInput("");
  };

  return <>
    <label htmlFor={id} className="form-label">Meta Keywords</label>
    <CreatableSelect<Keyword, true> inputId={id} instanceId={id} isMulti value={keywords} inputValue={input} menuIsOpen={false}
      onInputChange={(value, meta) => { if (meta.action === "input-change") setInput(value); }}
      onChange={setKeywords} components={{ DropdownIndicator: null, IndicatorSeparator: null }}
      placeholder="Type keyword and add comma"
      onKeyDown={(event) => {
        if (event.key === "," || (event.key === "Enter" && input.trim())) {
          event.preventDefault();
          add(input);
        }
      }} />
    <small><strong>Note:</strong> Enter tokens separated by commas (e.g., token1, token2, token3).</small>
  </>;
}

function SeoImage({ value, size, preview }: { value: unknown; size: number; preview?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={preview || assetUrl(leadText(value))} width={size} height={size} className={styles.image} alt="" loading="lazy"
      onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} />
  );
}

function SeoForm({ row, reset }: { row?: LeadRecord; reset: () => void }) {
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const imageUrl = useRef("");
  useEffect(() => () => { if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); }, []);

  return <form onSubmit={(event) => event.preventDefault()}>
    <h2 className="h5 mb-3">{row ? "Edit Seo Pages" : "Add Seo Pages"}</h2>
    <div className="mb-3">
      <label htmlFor="seo-title" className="form-label required">Title</label>
      <input id="seo-title" className="form-control" placeholder="Title" defaultValue={leadText(row?.title)} required readOnly={!!row} />
    </div>
    {!row && <div className="mb-3">
      <label htmlFor="seo-slug" className="form-label required">Slug</label>
      <input id="seo-slug" className="form-control" placeholder="Slug" required />
    </div>}
    <div className="mb-3">
      <label htmlFor="seo-meta-title" className="form-label">Meta Title</label>
      <input id="seo-meta-title" className="form-control" placeholder="Meta Title" defaultValue={leadText(row?.meta_title)} />
    </div>
    <div className="mb-3"><Keywords initial={leadText(row?.meta_keywords)} /></div>
    <div className="mb-3">
      <label htmlFor="seo-description" className="form-label">Description</label>
      <textarea id="seo-description" className="form-control" placeholder="Description" defaultValue={leadText(row?.meta_description)} />
    </div>
    <div className="mb-3">
      <label htmlFor="seo-file" className="form-label">Meta Image</label>
      <input id="seo-file" type="file" className={`form-control${fileError ? " is-invalid" : ""}`}
        accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => {
          if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
          imageUrl.current = "";
          const file = event.target.files?.[0];
          const invalid = file && (!/^image\/(jpeg|png|gif|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024);
          setFileError(invalid ? "Choose a JPG, PNG, GIF or WebP image up to 2 MB." : "");
          if (invalid) event.target.value = "";
          if (file && !invalid) imageUrl.current = URL.createObjectURL(file);
          setPreview(imageUrl.current);
        }} />
      {fileError && <div className="invalid-feedback">{fileError}</div>}
      {(preview || row?.meta_image) ? <div className="mt-3"><SeoImage value={row?.meta_image} preview={preview} size={150} /></div> : null}
    </div>
    <div className="d-flex justify-content-between">
      <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>{row ? "Cancel" : "Reset"}</button>
      <button type="submit" className="btn btn-primary btn-sm" disabled>{row ? "Update" : "Save"}</button>
    </div>
  </form>;
}

const metadataColumns = [
  ["title", "Title"], ["slug", "Slug"], ["meta_title", "Meta Title"], ["meta_keywords", "Meta Keywords"],
] as const;

export default function AdminSeoPages() {
  const [form, setForm] = useState<{ key: number; row?: LeadRecord; pending?: boolean; error?: string }>({ key: 0 });
  const [total, setTotal] = useState(0);
  const detailRequest = useRef<AbortController | undefined>(undefined);
  const formPanel = useRef<HTMLDivElement>(null);
  useEffect(() => () => detailRequest.current?.abort(), []);

  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    const result = await apiFetch<LeadListResult>(`seo_pages/server-side?${query}`, { signal });
    if (!Array.isArray(result?.data) || !Number.isFinite(result.totalRecords) || !Number.isFinite(result.filteredRecords)) {
      throw new Error("SEO pages could not be loaded.");
    }
    if (!signal.aborted) setTotal(result.totalRecords);
    return result;
  }, []);

  function reset() {
    detailRequest.current?.abort();
    setForm((previous) => ({ key: previous.key + 1 }));
  }

  function edit(row: LeadRecord) {
    const id = leadText(row.id);
    if (!/^\d+$/.test(id)) return;
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setForm((previous) => ({ key: previous.key + 1, row, pending: true }));
    formPanel.current?.scrollIntoView({ block: "nearest" });
    apiFetch<LeadRecord>(`seo_pages/${id}`, { signal: controller.signal }).then((detail) => {
      if (!detail || typeof detail !== "object" || Array.isArray(detail)) throw new Error("Invalid SEO detail response.");
      if (!controller.signal.aborted) setForm((previous) => ({ key: previous.key + 1, row: { ...row, ...detail } }));
    }).catch(() => {
      if (!controller.signal.aborted) setForm((previous) => ({ key: previous.key + 1, row, error: "Full SEO details could not be loaded." }));
    });
  }

  const columns: DashboardColumn[] = [
    { key: "meta_image", label: "Image", sortable: false, render: (row) => <SeoImage value={row.meta_image} size={50} /> },
    ...metadataColumns.map(([key, label]) => ({ key, label, render: (row: LeadRecord) => leadText(row[key]) })),
    { key: "action", label: "Action", sortable: false, render: (row) => <div className="dropdown">
      <button type="button" className="btn btn-sm btn-light" data-bs-toggle="dropdown" aria-expanded="false"
        aria-label={`Actions for ${leadText(row.title) || "SEO page"}`}>
        <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
      </button>
      <ul className="dropdown-menu">
        <li><button type="button" className="dropdown-item" onClick={() => edit(row)}>
          <i className="bx bx-edit me-2" aria-hidden="true" />Edit
        </button></li>
        <li><button type="button" className="dropdown-item text-danger" disabled>
          <i className="bx bx-trash me-2" aria-hidden="true" />Delete
        </button></li>
      </ul>
    </div> },
  ];

  return <div className={styles.master}>
    <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
      <div>
        <h1 className={`mb-1 ${styles.heading}`}>Seo Pages{total > 0 && <span className={`badge ms-2 ${styles.count}`}>{total}</span>}</h1>
        <ReportsBreadcrumb page="Seo Pages" title="Seo Pages List" />
      </div>
      <button type="button" className="btn btn-primary mb-2" onClick={reset}>Add Seo Pages</button>
    </div>
    <div className="row g-3">
      <div className="col-md-4" ref={formPanel}>
        <div className="card"><div className="card-body">
          {form.pending ? <p role="status">Loading SEO details...</p> : <>
            {form.error && <p role="alert">{form.error}</p>}
            <SeoForm key={form.key} row={form.row} reset={reset} />
          </>}
        </div></div>
      </div>
      <div className="col-md-8">
        <DashboardTable title="Seo Pages List" columns={columns} load={load} hideHeading />
      </div>
    </div>
  </div>;
}
