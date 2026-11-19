"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { leadDate, leadText } from "@/lib/adminEnquiries";
import { getAdminMemberData, type Member, type MemberKind, type MemberList, type MemberVariant } from "@/lib/adminMembers";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import MemberFilters from "./MemberFilters";
import styles from "./catalog-master.module.css";
import memberStyles from "./member-list.module.css";

type Column = { key: string; label: string; sortable?: boolean; render: (row: Member, index: number) => ReactNode };
type Interest = { category_name: string; subcategories: string[] };
type Sort = { field: string; direction: "ASC" | "DESC" };
const emptyResult: MemberList = { data: [], totalRecords: 0, filteredRecords: 0 };
const isOn = (value: unknown) => value === true || leadText(value) === "1";
const na = <small><i>NA</i></small>;
const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const icons = (name: string) => <i className={`bx ${name} me-1`} aria-hidden="true" />;

function Lines({ row, fields }: { row: Member; fields: string[] }) {
  const shown = fields.map((field) => leadText(row[field])).filter((value) => value && value !== "NA");
  return shown.length ? shown.map((value, index) => <div key={index}>{value}</div>) : na;
}

function Status({ value, label }: { value: unknown; label: string }) {
  return <div className={`form-check form-switch ${memberStyles.status}`}>
    <input className="form-check-input" type="checkbox" role="switch" aria-label={label} checked={isOn(value)} disabled />
  </div>;
}

function MemberActions({ id, buyer, variant }: { id: string; buyer: boolean; variant: MemberVariant }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; upward: boolean }>();
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(undefined);
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) close();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keydown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menu.current?.querySelector<HTMLElement>("a, button:not(:disabled)")?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);
  const disabled = (name: string, symbol: string) => <li><button className={`dropdown-item ${name === "Delete" ? "text-danger" : ""}`} type="button" disabled>{icons(symbol)} {name}</button></li>;
  const login = disabled("Login", "bx-log-in");
  return <>
    <button ref={trigger} className={`btn btn-sm btn-light ${memberStyles.actionButton}`} type="button" aria-label={`Actions for ${buyer ? "buyer" : "seller"} ${id}`} aria-expanded={!!position} onClick={(event) => {
      if (position) { setPosition(undefined); return; }
      const rect = event.currentTarget.getBoundingClientRect();
      const upward = window.innerHeight - rect.bottom < 190 && rect.top > 190;
      setPosition({ top: upward ? rect.top : rect.bottom, left: Math.max(4, Math.min(rect.left, window.innerWidth - 166)), upward });
    }}><i className="bx bx-dots-vertical-rounded" aria-hidden="true" /></button>
    {position && createPortal(<ul ref={menu} className={`dropdown-menu ${memberStyles.menu}`} style={{ top: position.top, left: position.left, transform: position.upward ? "translateY(-100%)" : undefined }}>
      {variant === "deleted" ? <>{disabled("Restore", "bx-windows")}{disabled("Delete", "bx-trash")}</> : <>
        {buyer && login}
        <li><Link className="dropdown-item" href={`/admin/edit_${buyer ? "buyer" : "seller"}/${encodeURIComponent(id)}`} onClick={() => setPosition(undefined)}>{icons("bx-edit")} Edit</Link></li>
        {disabled("Delete", "bx-trash")}
        {!buyer && <>
          {(variant === "all" || variant === "notCompleted") && disabled("Mail", "bx-envelope")}
          {login}
          {variant === "all" && disabled("Mail History", "bx-envelope")}
        </>}
      </>}
    </ul>, document.body)}
  </>;
}

function SourcingInterests({ id, onClose }: { id: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<Interest[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    dialog.current?.showModal();
    getAdminMemberData<Interest[]>(new URLSearchParams({ kind: "buyers", action: "sourcing", id }), controller.signal)
      .then(setResult).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [id]);
  return <dialog ref={dialog} className={memberStyles.dialog} aria-labelledby="sourcing-title" onClose={onClose}>
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="sourcing-title">Sourcing Interests</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">
        {error ? <p role="alert">{error}</p> : !result ? <p role="status">Loading...</p> : result.length ? result.map(({ category_name, subcategories }, index) =>
          <div className="mb-2" key={index}><strong>{category_name}</strong>{subcategories.length > 0 && <ul className="mb-2">{subcategories.map((name, subIndex) => <li key={subIndex}>{name}</li>)}</ul>}</div>
        ) : <p>No sourcing interests found.</p>}
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => dialog.current?.close()}>Close</button></div>
    </div>
  </dialog>;
}

export default function MemberListing({ kind, variant = "all" }: { kind: MemberKind; variant?: MemberVariant }) {
  const buyer = kind === "buyers";
  const singular = buyer ? "Buyer" : "Seller";
  const plural = `${singular}s`;
  const deleted = variant === "deleted";
  const title = variant === "all" ? `${plural} List` : `${{
    inactive: "Inactive", notApproved: "Not Approved", notCompleted: "Not Completed", deleted: "Recently Deleted",
  }[variant]} ${plural}`;
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState<Sort>({ field: !buyer && variant === "all" ? "approve_date" : variant === "notCompleted" ? "updated_at" : "id", direction: "DESC" });
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [interestId, setInterestId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [result, setResult] = useState<MemberList>(emptyResult);
  const [completedQuery, setCompletedQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (buyer || variant !== "notApproved") return;
    const controller = new AbortController();
    getAdminMemberData<string[]>(new URLSearchParams({ kind, action: "messages" }), controller.signal).then(setMessages).catch(() => {});
    return () => controller.abort();
  }, [buyer, kind, variant]);

  const query = new URLSearchParams({ kind, variant, page: String(page), limit: String(limit), sortBy: sort.field, sort: sort.direction });
  if (debouncedSearch) query.set("search", debouncedSearch);
  for (const [key, value] of Object.entries(filters)) if (value.trim()) query.set(key, value.trim());
  const queryKey = query.toString();
  const loading = completedQuery !== queryKey;
  useEffect(() => {
    const controller = new AbortController();
    getAdminMemberData<MemberList>(new URLSearchParams(queryKey), controller.signal).then((data) => {
      setResult(data);
      setError("");
    }).catch((reason: Error) => {
      if (controller.signal.aborted) return;
      setResult(emptyResult);
      setError(reason.message);
    }).finally(() => {
      if (!controller.signal.aborted) setCompletedQuery(queryKey);
    });
    return () => controller.abort();
  }, [queryKey]);

  const rows = result.data;
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(leadText(row.id)));
  const pageCount = Math.max(1, Math.ceil(result.filteredRecords / limit));
  const firstPage = Math.max(1, Math.min(pageCount - 4, page - 2));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index);
  const accountStatus = variant === "notApproved";
  const showApproval = !buyer && (variant === "all" || variant === "inactive");
  const showSelectedMail = variant === "all" || (!buyer && variant === "notCompleted");
  const profileName = singular.toLowerCase();

  const dateColumn = (key: string, label: string): Column => ({ key, label, sortable: true, render: (row) => leadDate(row[key]) });
  const columns: Column[] = [
    { key: "id", label: "S.No.", sortable: true, render: (row, index) => <Link href={`/admin/${profileName}/user-profile/${encodeURIComponent(leadText(row.id))}`}>{(page - 1) * limit + index + 1}</Link> },
  ];
  if (buyer) {
    columns.push(
      { key: "user_company", label: "Company", sortable: true, render: (row) => <>
        {row.user_company ? <strong>{leadText(row.user_company)}</strong> : null}
        {["full_name", "email", "mobile"].map((key) => row[key] ? <div key={key}>{leadText(row[key])}</div> : null)}
        {isOn(row.is_trading) && <div><span className="badge bg-success mb-1">Trader</span></div>}
        {isOn(row.walkin_buyer) && <div><span className="badge bg-primary mb-1">Walk-In Buyer</span></div>}
        {!deleted && variant !== "inactive" && row.is_sourcing_interest === "yes" && <button className="btn btn-sm btn-info my-2 p-1 px-2" style={{ fontSize: 11 }} type="button" onClick={() => setInterestId(leadText(row.id))}>{icons("bx-info-circle")} Sourcing Interests</button>}
      </> },
      { key: "address", label: "Location", sortable: true, render: (row) => <Lines row={row} fields={["country_name", "state_name", "city_name"]} /> },
    );
    if (!deleted) columns.push({ key: "status", label: accountStatus ? "Account Status" : "User Status", render: (row) => <Status label={accountStatus ? "Account Status" : "User Status"} value={accountStatus ? row.is_approve : row.status} /> });
    if (variant === "all") columns.push({ key: "is_seller", label: "Make Seller", render: (row) => <Status label="Make Seller" value={row.is_seller} /> });
    columns.push({ key: "user_category", label: "User Category", sortable: true, render: (row) => leadText(row.user_category) || na });
  } else {
    if (accountStatus) columns.push({ key: "accept_status", label: "Accept/Decline", render: (row) => messages.includes(leadText(row.id))
      ? <button type="button" className="badge bg-dark rounded-pill p-2 border-0" disabled aria-label="View decline reason">{icons("bx-question-mark")}</button>
      : <div className="d-flex gap-2"><button type="button" className="badge bg-success py-2 border-0" disabled aria-label="Accept">{icons("bx-check")}</button><button type="button" className="badge bg-danger py-2 border-0" disabled aria-label="Decline">{icons("bx-x")}</button></div> });
    columns.push(
      { key: "organization_name", label: "Company", sortable: true, render: (row) => {
        const organization = titleCase(leadText(row.organization_name));
        const slug = leadText(row.organization_slug);
        const products = new URLSearchParams({ id: leadText(row.id), cid: leadText(row.company_id) });
        return <>
          {organization && <div><strong>{slug ? <Link href={`/companies/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">{organization}</Link> : organization}</strong></div>}
          {[1, 2].includes(Number(row.elcina_member)) && <div><span className="badge bg-primary mb-1 text-uppercase">{isOn(row.elcina_member) ? "Elcina Member" : "Trial"}</span></div>}
          {isOn(row.is_trading) && <div><span className="badge bg-success mb-1">Trader</span></div>}
          {([["full_name", "bx-user"], ["email", "bx-user"], ["mobile", "bx-mobile"], ["state_name", "bx-map"], ["city_name", "bx-map"]]).map(([key, glyph]) => row[key] ? <div key={key}>{icons(glyph)}{leadText(row[key])}</div> : null)}
          <strong>Products:</strong>{" "}<Link href={`/admin/product-list?${products}`}><span className="badge bg-primary mb-1">{leadText(row.user_count) || "0"}</span></Link>
        </>;
      } },
      { key: "coreactivity_name", label: "Coreactivity / Category / Segment / Sub Segment", sortable: true, render: (row) => <Lines row={row} fields={["coreactivity_name", "activity_name", "category_name", "sub_category_name"]} /> },
      { key: "designation", label: "Designation / Website / Quality Certification", sortable: true, render: (row) => <Lines row={row} fields={["designation", "company_website", "organization_quality_certification"]} /> },
    );
  }
  columns.push(dateColumn("created_at", "Created"), dateColumn("updated_at", "Last Update"));
  if (showApproval) columns.push(dateColumn("approve_date", "Approve Date"), { key: "status", label: "Status", render: (row) => <Status label="Status" value={row.status} /> });
  columns.push({ key: "action", label: "Action", render: (row) => <MemberActions id={leadText(row.id)} buyer={buyer} variant={variant} /> });

  async function exportRows() {
    setExporting(true);
    setExportError("");
    const params = new URLSearchParams(queryKey);
    params.set("limit", "100");
    const exported: Member[] = [];
    try {
      for (let currentPage = 1; ; currentPage++) {
        params.set("page", String(currentPage));
        const data = await getAdminMemberData<MemberList>(params);
        exported.push(...data.data);
        if (!data.data.length || currentPage * 100 >= data.filteredRecords) break;
      }
      const exportColumns: Array<[string, string]> = [
        ["ID", "id"], ["Company", buyer ? "user_company" : "organization_name"], ["Name", "full_name"], ["Email", "email"],
        ["Mobile", "mobile"], ["Country", "country_name"], ["State", "state_name"], ["City", "city_name"],
      ];
      if (buyer) exportColumns.push(["User Category", "user_category"]);
      else exportColumns.push(
        ["Core Activity", "coreactivity_name"], ["Activity", "activity_name"], ["Category", "category_name"], ["Sub Category", "sub_category_name"],
        ["Designation", "designation"], ["Website", "company_website"], ["Quality Certification", "organization_quality_certification"],
      );
      exportColumns.push(["Created", "created_at"], ["Last Update", "updated_at"]);
      downloadAdminWorkbook(exported, exportColumns, `${plural} Export.xlsx`);
    } catch {
      setExportError("Could not download the Excel file.");
    } finally {
      setExporting(false);
    }
  }

  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
      <div>
        <h4 className={`mb-1 d-flex align-items-center ${styles.heading}`}>{title}{result.totalRecords > 0 && <span className={`badge ms-2 ${styles.count}`}>{result.totalRecords}</span>}</h4>
        <nav className="d-none d-sm-block mb-3" aria-label="Breadcrumb"><ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
          <li className="breadcrumb-item">{title}</li><li className="breadcrumb-item active" aria-current="page">{title}</li>
        </ol></nav>
      </div>
      <div className="d-flex flex-wrap justify-content-end gap-2 ms-auto mb-2">
        {showSelectedMail && <button type="button" className="btn btn-sm btn-primary" disabled>{buyer ? "Mail to Selected User" : "Selected Mail"}</button>}
        {((buyer && !deleted) || showSelectedMail) && <button type="button" className="btn btn-sm btn-primary" disabled>All Mail</button>}
        <button type="button" className="btn btn-sm btn-primary" disabled={loading || exporting} onClick={() => void exportRows()}>{icons("bx-download")} {exporting ? "Exporting..." : "Excel"}</button>
        {!deleted && <>
          <button type="button" className="btn btn-sm btn-danger" disabled>{icons("bx-trash")} Delete Selected</button>
          <Link className="btn btn-primary" href={`/admin/add_${profileName}`}>{icons("bxs-plus-square")} Add {singular}</Link>
        </>}
      </div>
    </div>
    <MemberFilters kind={kind} deleted={deleted} onApply={(next) => { setFilters(next); setPage(1); setSelected([]); }} />
    <div className="card"><div className="card-body">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom pb-4 mt-2">
        <label className="d-flex align-items-center gap-2"><select className="form-select form-select-sm w-auto" aria-label="Entries per page" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
          {[25, 50, 100].map((size) => <option key={size}>{size}</option>)}
        </select> entries per page</label>
        <label className="d-flex align-items-center gap-2">Search: <input type="text" placeholder="Search..." className={`form-control form-control-sm ${styles.search}`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      {exportError && <p className="text-danger" role="alert">{exportError}</p>}
      {error && !loading && <p className="text-danger" role="alert">{error}</p>}
      <div className="table-responsive border rounded-2 mt-4" aria-busy={loading}>
        <table className={`table table-striped table-hover align-middle dataTable mb-0 ${memberStyles.memberTable}`}>
          <thead><tr>
            {!deleted && <th scope="col"><input type="checkbox" aria-label="Select all on page" checked={allSelected} disabled={loading || !rows.length} onChange={(event) => {
              const ids = rows.map((row) => leadText(row.id));
              setSelected((previous) => event.target.checked ? [...new Set([...previous, ...ids])] : previous.filter((id) => !ids.includes(id)));
            }} /></th>}
            {columns.map(({ key, label, sortable }) => <th key={key} scope="col" aria-sort={sort.field === key ? (sort.direction === "ASC" ? "ascending" : "descending") : undefined}>
              {sortable ? <button type="button" className={styles.sort} onClick={() => {
                setPage(1);
                setSort({ field: key, direction: sort.field === key && sort.direction === "ASC" ? "DESC" : "ASC" });
              }}>{label} <span aria-hidden="true">{sort.field === key ? (sort.direction === "ASC" ? "↑" : "↓") : "↕"}</span></button> : label}
            </th>)}
          </tr></thead>
          <tbody>{loading || !rows.length ? <tr><td className="text-center py-3" colSpan={columns.length + Number(!deleted)}>{loading ? "Loading..." : error ? "Records unavailable" : "No records found."}</td></tr> : rows.map((row, index) => {
            const id = leadText(row.id);
            return <tr key={id}>
              {!deleted && <td><input type="checkbox" aria-label={`Select ${profileName} ${id}`} checked={selected.includes(id)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, id] : previous.filter((item) => item !== id))} /></td>}
              {columns.map(({ key, render }) => <td key={key} className={key === "organization_name" || key === "user_company" ? memberStyles.company : undefined}>{render(row, index)}</td>)}
            </tr>;
          })}</tbody>
        </table>
      </div>
      {!loading && rows.length > 0 && <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
        <div>Showing {rows.length ? (page - 1) * limit + 1 : 0} to {rows.length ? (page - 1) * limit + rows.length : 0} of {result.filteredRecords} entries{result.filteredRecords !== result.totalRecords && ` (filtered from ${result.totalRecords} total entries)`}</div>
        <nav aria-label={`${plural} pagination`}><ul className="pagination mb-0">
          <li className="page-item"><button type="button" className="page-link" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page"><i className="bx bx-chevrons-left" /></button></li>
          <li className="page-item"><button type="button" className="page-link" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><i className="bx bx-chevron-left" /></button></li>
          {pageNumbers.map((number) => <li key={number} className={`page-item ${page === number ? "active" : ""}`}><button type="button" className="page-link" aria-current={page === number ? "page" : undefined} disabled={loading} onClick={() => setPage(number)}>{number}</button></li>)}
          <li className="page-item"><button type="button" className="page-link" disabled={page >= pageCount} onClick={() => setPage(page + 1)} aria-label="Next page"><i className="bx bx-chevron-right" /></button></li>
          <li className="page-item"><button type="button" className="page-link" disabled={page >= pageCount} onClick={() => setPage(pageCount)} aria-label="Last page"><i className="bx bx-chevrons-right" /></button></li>
        </ul></nav>
      </div>}
    </div></div>
    {interestId && <SourcingInterests id={interestId} onClose={() => setInterestId("")} />}
  </div>;
}
