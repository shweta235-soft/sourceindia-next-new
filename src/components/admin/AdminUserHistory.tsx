"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { activityStatus, activityUserType } from "@/lib/adminUserActivity";
import { getUserHistoryData } from "@/lib/adminUserHistory";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import UserHistoryFilters from "./UserHistoryFilters";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import modalStyles from "./product-keywords.module.css";

const exportColumns: [string, string][] = [
  ["Status", "getStatus"], ["Organization name", "company_name"], ["Member", "membership_plan_name"],
  ["Fname", "fname"], ["Lname", "lname"], ["Email", "email"], ["Mobile", "mobile"],
  ["Country Name", "country_name"], ["State Name", "state_name"], ["City Name", "city_name"],
  ["Is Seller", "getUserStatus"], ["Created", "created_at"], ["Last Update", "updated_at"],
];

function StatusConfirmation({ deactivate, close }: { deactivate: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={title} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header">
        <h5 id={title} className="modal-title">Confirm Status Change</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">Are you sure you want to {deactivate ? "deactivate" : "activate"} this User History?</div>
      <div className="modal-footer justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className="btn btn-warning" disabled>Yes, Change</button>
      </div>
    </div></div>
  </dialog>;
}

function CompanyInfo({ row }: { row: LeadRecord }) {
  const company = leadText(row.organization_name);
  const slug = leadText(row.organization_slug);
  return <>
    {company && <h6 className="username">{slug && slug !== "." && slug !== ".." ?
      <Link href={`/companies/${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer">{company}</Link> : company}</h6>}
    {leadText(row.elcina_member) === "1" && <div><span className="badge bg-primary">Elcina Member</span></div>}
    {([["full_name", "bx-user"], ["email", "bx-envelope"], ["mobile", "bx-mobile"], ["country_name", "bx-globe"],
      ["state_data", "bx-map"], ["city_data", "bx-map"]] as const).map(([field, icon]) => (
      leadText(row[field]) && <div key={field}><i className={`bx ${icon} me-1`} aria-hidden="true" />{leadText(row[field])}</div>
    ))}
  </>;
}

export default function AdminUserHistory() {
  const [applied, setApplied] = useState("");
  const [total, setTotal] = useState<number>();
  const [changeStatus, setChangeStatus] = useState<boolean>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    for (const [key, value] of new URLSearchParams(applied)) params.set(key, value);
    const result = await getUserHistoryData<LeadListResult>("list", params, signal);
    if (!signal.aborted) setTotal(result.totalRecords);
    return result;
  }, [applied]);

  const columns: DashboardColumn[] = [
    { key: "organization_name", label: "Company", render: (row) => <CompanyInfo row={row} /> },
    { key: "steps", label: "Steps", render: (row) => {
      const status = activityStatus(row.status);
      return status && <span className="badge bg-primary">{status} Seller</span>;
    } },
    { key: "is_seller", label: "Is Seller", render: (row) => <span className="badge bg-primary">{activityUserType(row.is_seller)}</span> },
    { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
    { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
    { key: "status", label: "Status", sortable: false, render: (row) => {
      const active = row.status === "1";
      return <div className="form-check form-switch">
        <input type="checkbox" role="switch" className="form-check-input" checked={active}
          aria-label={`Status of ${leadText(row.full_name) || leadText(row.organization_name) || `user ${leadText(row.id)}`}`}
          onChange={() => setChangeStatus(active)} />
      </div>;
    } },
  ];

  async function exportHistory() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getUserHistoryData<LeadRecord[]>("export");
      downloadAdminWorkbook(rows.map((row) => ({
        ...row, getStatus: leadText(row.getStatus) || activityStatus(row.status),
        getUserStatus: leadText(row.getUserStatus) || activityUserType(row.is_seller),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), exportColumns, "User History Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page="User Histories" title="User History List" />
    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
      <h5 className="mb-0">User Histories{total !== undefined && <span className="badge bg-primary ms-2">{total}</span>}</h5>
      <button type="button" className="btn btn-primary" disabled={exporting} onClick={exportHistory}>
        <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
      </button>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    <UserHistoryFilters apply={setApplied} />
    <DashboardTable key={applied} title="User History List" hideHeading columns={columns} load={load} />
    {changeStatus !== undefined && <StatusConfirmation deactivate={changeStatus} close={() => setChangeStatus(undefined)} />}
  </>;
}
