"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { LeadListResult, LeadRecord } from "@/lib/adminEnquiries";
import styles from "./dashboard-sections.module.css";

export type DashboardColumn = {
  key: string;
  sortable?: boolean;
  label: ReactNode;
  render: (row: LeadRecord) => ReactNode;
};

export default function DashboardTable({
  id, title, columns, load, headerAction, hideHeading, leadingColumn, renderSerial, initialSortDirection = "DESC",
}: {
  id?: string;
  headerAction?: ReactNode;
  hideHeading?: boolean;
  title: string;
  columns: DashboardColumn[];
  leadingColumn?: DashboardColumn;
  initialSortDirection?: "ASC" | "DESC";
  renderSerial?: (row: LeadRecord, serial: number) => ReactNode;
  load: (query: URLSearchParams, signal: AbortSignal) => Promise<LeadListResult>;
}) {
  const heading = useId();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", direction: initialSortDirection });
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{ key: string; result?: LeadListResult; error?: string }>();
  const query = new URLSearchParams({
    page: String(page), limit: String(limit), search: submittedSearch, sortBy: sort.key, sort: sort.direction,
  }).toString();
  const requestKey = `${query}:${attempt}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (submittedSearch !== search.trim()) {
        setSubmittedSearch(search.trim());
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, submittedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    void load(new URLSearchParams(query), controller.signal).then((result) => {
      if (!controller.signal.aborted) setResponse({ key: requestKey, result });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResponse({ key: requestKey, error: error instanceof Error ? error.message : "Unable to load records." });
    });
    return () => controller.abort();
  }, [load, query, requestKey]);

  const displayed = response?.key === requestKey ? response : undefined;
  const rows = displayed?.result?.data ?? [];
  const total = displayed?.result?.totalRecords ?? 0;
  const filtered = displayed?.result?.filteredRecords ?? 0;
  const pages = Math.ceil(filtered / limit);
  const firstPage = Math.max(1, Math.min(page - 2, pages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pages) }, (_, index) => firstPage + index);
  const serialStart = (page - 1) * limit;
  const tableColumns = [...(leadingColumn ? [leadingColumn] : []), { key: "id", label: "S.No.", sortable: true }, ...columns];

  return (
    <section className={styles.tableSection} id={id} aria-labelledby={heading} tabIndex={id ? -1 : undefined}>
      {headerAction ? <div className={`card mb-3 ${styles.stockCard}`}>
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h5 id={heading} className="mb-0">{title}</h5>
          {headerAction}
        </div>
      </div> : hideHeading ? <h6 id={heading} className="visually-hidden">{title}</h6> : <>
        <h6 id={heading} className="mb-0 text-uppercase">{title}</h6>
        <hr />
      </>}
      <div className={`card ${styles.stockCard}`}>
        <div className="card-body">
          <div className="row mt-2 justify-content-between border-bottom pb-4 gy-2">
            <label className="d-flex align-items-center col-auto gap-2">
              <select className="form-select form-select-sm w-auto" value={limit} aria-label="Entries per page"
                onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                {[25, 50, 100].map((size) => <option key={size}>{size}</option>)}
              </select>
              entries per page
            </label>
            <label className="d-flex align-items-center col-auto gap-2">
              Search:
              <input className={`form-control form-control-sm ${styles.search}`} placeholder="Search..." maxLength={100}
                value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
          <div className="table-responsive border rounded-2 mt-4" aria-busy={!displayed}>
            <table className={`table table-striped table-hover align-middle mb-0 ${styles.table}`}>
              <thead><tr>{tableColumns.map(({ key, label, sortable }) => (
                <th key={key} scope="col" aria-sort={sort.key === key ? sort.direction === "ASC" ? "ascending" : "descending" : undefined}>
                  {sortable === false ? label : <button type="button" className={styles.sortButton} onClick={() => {
                    setSort({ key, direction: sort.key === key && sort.direction === "ASC" ? "DESC" : "ASC" });
                    setPage(1);
                  }}>
                    {label}<span aria-hidden="true">{sort.key === key ? sort.direction === "ASC" ? "↑" : "↓" : "↕"}</span>
                  </button>}
                </th>
              ))}</tr></thead>
              <tbody>{rows.length ? rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  {leadingColumn && <td>{leadingColumn.render(row)}</td>}
                  <td>{renderSerial ? renderSerial(row, serialStart + index + 1) : serialStart + index + 1}</td>
                  {columns.map(({ key, render }) => <td key={key}>{render(row)}</td>)}
                </tr>
              )) : <tr><td className="text-center" colSpan={tableColumns.length}>
                {!displayed ? <span role="status">Loading…</span> : displayed.error ? <>
                  <span role="alert">{displayed.error}</span>
                  <button type="button" className="btn btn-link btn-sm" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button>
                </> : <>No records found.{page > 1 &&
                  <button type="button" className="btn btn-link btn-sm" onClick={() => setPage(1)}>Back to first page</button>}</>}
              </td></tr>}</tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="d-flex flex-wrap gap-2 justify-content-between mt-2">
              <span>Showing {serialStart + 1} to {serialStart + rows.length} of {filtered} entries
                {submittedSearch && ` (filtered from ${total} total entries)`}
              </span>
              <nav aria-label={`${title} pages`}>
                <ul className={`pagination mb-0 ${styles.pagination}`}>
                  <PageControl label="First page" icon="bx-chevrons-left" disabled={page <= 1} onClick={() => setPage(1)} />
                  <PageControl label="Previous page" icon="bx-chevron-left" disabled={page <= 1} onClick={() => setPage(page - 1)} />
                  {pageNumbers.map((number) => <li className={`page-item ${page === number ? "active" : ""}`} key={number}>
                    <button type="button" className="page-link" aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
                  </li>)}
                  <PageControl label="Next page" icon="bx-chevron-right" disabled={page >= pages} onClick={() => setPage(page + 1)} />
                  <PageControl label="Last page" icon="bx-chevrons-right" disabled={page >= pages} onClick={() => setPage(pages)} />
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PageControl({ label, icon, disabled, onClick }: { label: string; icon: string; disabled: boolean; onClick: () => void }) {
  return <li className="page-item"><button type="button" className="page-link" aria-label={label} disabled={disabled} onClick={onClick}>
    <i className={`bx ${icon}`} aria-hidden="true" />
  </button></li>;
}
