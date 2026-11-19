"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { getAdminSubmissions } from "@/lib/adminSubmissions";
import AdminRowActions, { type RowAction } from "./AdminRowActions";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";
import modalStyles from "./product-keywords.module.css";

type EmailAction = "Delete" | "Clone";

function EmailActionDialog({ action, close }: { action: EmailAction; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header">
        <h5 id={titleID} className="modal-title">{action === "Delete" ? "Confirm Deletion" : "Clone Email"}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">Are you sure you want to {action.toLowerCase()} this email?</div>
      <div className="modal-footer justify-content-between">
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
        <button className={`btn ${action === "Delete" ? "btn-danger" : "btn-primary"}`} type="button" disabled>{action}</button>
      </div>
    </div></div>
  </dialog>;
}

const displayedFields = [["title", "Title"], ["email_for", "Email For"], ["subject", "Subject"], ["status", "Status"],
  ["created_at", "Created At"], ["updated_at", "Updated At"]] as const;

export default function AdminEmailList() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [emailFor, setEmailFor] = useState("");
  const [total, setTotal] = useState<number>();
  const [emailAction, setEmailAction] = useState<EmailAction>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    params.set("kind", "emails");
    params.set("emailFor", emailFor);
    const result = await getAdminSubmissions<LeadListResult>(params, signal);
    if (!signal.aborted) setTotal(result.totalRecords);
    return result;
  }, [emailFor]);

  const columns: DashboardColumn[] = displayedFields.map(([key, label]) => ({
    key, label, render: (row) => key === "created_at" || key === "updated_at" ? leadDate(row[key]) : leadText(row[key]),
  }));
  columns.push({ key: "action", label: "Action", sortable: false, render: (row) => {
    const id = leadText(row.id);
    const actions: RowAction[] = [];
    if (/^\d{1,12}$/.test(id)) actions.push({ label: "Edit", icon: "bx-edit", onClick: () => router.push(`/admin/email-edit/${id}`) });
    actions.push({ label: "Delete", icon: "bx-trash", onClick: () => setEmailAction("Delete") },
      { label: "Clone", icon: "bx-copy", onClick: () => setEmailAction("Clone") });
    return <AdminRowActions name={leadText(row.title) || `email ${id}`} actions={actions} />;
  } });

  async function exportEmails() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getAdminSubmissions<LeadRecord[]>(new URLSearchParams({ kind: "emails", action: "export" }));
      downloadAdminWorkbook(rows.map((row) => ({
        ...row,
        getStatus: leadText(row.getStatus) || leadText(row.status),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), [["Title", "title"], ["Email For", "email_for"], ["Subject", "subject"], ["Status", "getStatus"],
        ["Created", "created_at"], ["Last Update", "updated_at"]], "Email Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page="Emails Templates" title="Email List" />
    <div className={`d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3 ${styles.heading}`}>
      <h5 className="mb-0">Email{total !== undefined && <span className="badge bg-primary ms-2">{total}</span>}</h5>
      <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={exportEmails}>
        <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
      </button>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    <form className="card mb-3" onSubmit={(event) => { event.preventDefault(); setEmailFor(draft.trim()); }}>
      <div className="card-body"><div className="row gy-2">
        <div className="col-md-8"><div className="d-flex align-items-center gap-2">
          <label className="form-label" htmlFor="emailForInput">Filter:</label>
          <input id="emailForInput" className="form-control" type="text" placeholder="Email For..."
            value={draft} onChange={(event) => setDraft(event.target.value)} />
        </div></div>
        <div className="col-md-4 d-flex justify-content-end gap-2">
          <button className="btn btn-primary" type="submit">Apply</button>
          <button className="btn btn-secondary" type="button" onClick={() => { setDraft(""); setEmailFor(""); }}>Clear</button>
        </div>
      </div></div>
    </form>
    <DashboardTable key={emailFor} title="Email List" hideHeading load={load} columns={columns} />
    {emailAction && <EmailActionDialog action={emailAction} close={() => setEmailAction(undefined)} />}
  </>;
}
