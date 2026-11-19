"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import Select, { type StylesConfig } from "react-select";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { reportSources, reports, type ReportKind, type ReportOption, type ReportSource } from "@/lib/adminReports";
import CatalogDateFilter from "./CatalogDateFilter";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import styles from "./admin-reports.module.css";

type Lookup = { rows?: LeadRecord[]; failed?: boolean };
type Lookups = Partial<Record<ReportSource, Lookup>>;
type Filter = (typeof reports)[ReportKind]["filters"][number];
const baseSources = (Object.keys(reportSources) as ReportSource[]).filter((key) => !("parent" in reportSources[key]));
const emptyDates = { startDate: "", endDate: "" };
const selectStyles: StylesConfig<ReportOption, false> = {
  control: (base) => ({ ...base, minHeight: 36, borderColor: "#dee2e6", borderRadius: 5 }),
  dropdownIndicator: (base) => ({ ...base, padding: "5px 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, zIndex: 4 }),
};

async function readRows(params: URLSearchParams, signal: AbortSignal): Promise<LeadRecord[]> {
  const response = await fetch(`/admin/report-data?${params}`, { cache: "no-store", signal });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Report data could not be loaded.");
  }
  return response.json();
}

function FilterSelect({ filter, lookup, parent, value, change }: {
  filter: Filter; lookup?: Lookup; parent?: string; value: string; change: (value: string) => void;
}) {
  const id = useId();
  const source = filter.source;
  const [dependent, setDependent] = useState<Lookup & { parent: string }>();

  useEffect(() => {
    if (!parent || !source) return;
    const controller = new AbortController();
    void readRows(new URLSearchParams({ action: "options", source, parent }), controller.signal)
      .then((rows) => { if (!controller.signal.aborted) setDependent({ parent, rows }); })
      .catch(() => { if (!controller.signal.aborted) setDependent({ parent, failed: true }); });
    return () => controller.abort();
  }, [source, parent]);

  const current = filter.parent ? dependent?.parent === parent ? dependent : undefined : lookup;
  const options = useMemo(() => {
    if (filter.options) return filter.options;
    const byValue = new Map<string, ReportOption>();
    for (const row of current?.rows ?? []) {
      const value = leadText(row[filter.valueKey ?? filter.key]);
      const label = filter.labelKeys?.map((key) => leadText(row[key])).filter(Boolean).join(" ") ?? value;
      if (value && label && !byValue.has(value)) byValue.set(value, { value, label });
    }
    return [...byValue.values()];
  }, [current, filter]);
  const disabled = Boolean(filter.parent && !parent);

  return <div className="col-md-3">
    <label htmlFor={id} className="visually-hidden">{filter.label}</label>
    <Select<ReportOption> instanceId={id} inputId={id} options={options} isClearable isSearchable
      styles={selectStyles} placeholder={filter.label} isDisabled={disabled} isLoading={Boolean(source && !disabled && !current)}
      noOptionsMessage={() => current?.failed ? "Options could not be loaded." : "No options"}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => change(option?.value ?? "")} />
  </div>;
}

function ReportCard({ kind, lookups }: { kind: ReportKind; lookups: Lookups }) {
  const report = reports[kind];
  const heading = useId();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [dates, setDates] = useState(emptyDates);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const exportRequest = useRef<AbortController | null>(null);
  useEffect(() => () => exportRequest.current?.abort(), []);

  function change(key: string, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      for (const filter of report.filters) {
        if (filter.parent === key) delete next[filter.key];
      }
      return next;
    });
  }

  async function exportReport() {
    if (exportRequest.current) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setBusy(true);
    setFeedback(undefined);
    const query = new URLSearchParams({ action: "export", kind });
    for (const [key, value] of Object.entries({ ...draft, ...dates })) {
      if (value) query.set(key, value);
    }
    try {
      const rows = await readRows(query, controller.signal);
      if (controller.signal.aborted) return;
      if (!rows.length) {
        setFeedback({ message: "No data found for export." });
        return;
      }
      downloadAdminWorkbook(rows.map((row) => {
        const raw = leadText(row.created_at);
        const date = new Date(raw);
        return { ...row, created_at: Number.isNaN(date.getTime()) ? raw : format(date, "yyyy-MM-dd hh:mm a") };
      }), report.columns, `${report.title}.xlsx`);
    } catch (error) {
      if (!controller.signal.aborted) {
        setFeedback({ message: error instanceof Error ? error.message : "Export could not be loaded.", error: true });
      }
    } finally {
      exportRequest.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <section className="card mb-3" aria-labelledby={heading}>
    <div className="card-body p-4">
      <h5 id={heading}>{report.title} Filter</h5>
      <form className="row g-3" onSubmit={(event) => { event.preventDefault(); void exportReport(); }}>
        {report.filters.map((filter) => <FilterSelect key={`${filter.key}-${filter.parent ? draft[filter.parent] ?? "" : ""}`}
          filter={filter} lookup={filter.source ? lookups[filter.source] : undefined} parent={filter.parent ? draft[filter.parent] : undefined}
          value={draft[filter.key] ?? ""} change={(value) => change(filter.key, value)} />)}
        <div className={`col-md-4 ${styles.dateField}`}>
          <CatalogDateFilter key={resetKey} dates={dates} onDraftChange={setDates} />
        </div>
        {report.flags && <div className="col-md-8">
          {report.flags.map(([label, key]) => <label className="form-check form-check-inline" key={key}>
            <input className="form-check-input" type="checkbox" checked={draft[key] === "1"}
              onChange={(event) => change(key, event.target.checked ? "1" : "")} />
            <span className="form-check-label">{label}</span>
          </label>)}
        </div>}
        {feedback && <p className={`col-12 mb-0 ${feedback.error ? "text-danger" : ""}`}
          role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
        <div className="col-12 d-flex justify-content-end flex-wrap gap-2">
          <button type="submit" className="btn btn-info btn-sm px-5 text-light" disabled={busy}>
            {busy ? "Exporting…" : "Export"}
          </button>
          <button type="button" className="btn btn-secondary btn-sm px-5" disabled={busy} onClick={() => {
            setDraft({});
            setDates(emptyDates);
            setResetKey((key) => key + 1);
            setFeedback(undefined);
          }}>Clear</button>
        </div>
      </form>
    </div>
  </section>;
}

export default function AdminReports() {
  const [lookups, setLookups] = useState<Lookups>({});

  useEffect(() => {
    const controller = new AbortController();
    for (const source of baseSources) {
      void readRows(new URLSearchParams({ action: "options", source }), controller.signal)
        .then((rows) => { if (!controller.signal.aborted) setLookups((current) => ({ ...current, [source]: { rows } })); })
        .catch(() => { if (!controller.signal.aborted) setLookups((current) => ({ ...current, [source]: { failed: true } })); });
    }
    return () => controller.abort();
  }, []);

  return <>
    <ReportsBreadcrumb page="Reports" title="Reports List" />
    <div className="row">
      <div className="col-xl-12 mx-auto">
        {(Object.keys(reports) as ReportKind[]).map((kind) => <ReportCard key={kind} kind={kind} lookups={lookups} />)}
      </div>
    </div>
  </>;
}
