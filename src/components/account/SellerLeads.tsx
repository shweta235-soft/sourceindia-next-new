"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { enquiryCode } from "@/lib/accountEnquiries";
import { canReadLeads, readLeadInbox } from "@/lib/accountLeadInbox";
import { leadDate, type LeadListResult } from "@/lib/adminEnquiries";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";
import AdminRowActions from "../admin/AdminRowActions";
import { downloadAdminWorkbook } from "../admin/exportCategoryMaster";
import { EnquiryStatus } from "./MyEnquiries";

const load = (query: URLSearchParams, signal: AbortSignal) => readLeadInbox<LeadListResult>(query, signal);
const cards = [
  ["totalApproved", "No. of Leads", "success", "/element-02.svg"],
  ["openApproved", "Open Leads", "warning", "/element-04.svg"],
  ["closedApproved", "Closed Leads", "primary", "/element-01.svg"],
] as const;

export default function SellerLeads() {
  const { user } = useAuth();
  const allowed = Boolean(user && canReadLeads(user));
  const userId = text(user?.id);
  const [counts, setCounts] = useState<{ userId: string; data?: Record<string, string>; error?: string }>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [selected, setSelected] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const exportRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    void readLeadInbox<Record<string, string>>(new URLSearchParams({ view: "counts" }), controller.signal)
      .then((data) => { if (!controller.signal.aborted) setCounts({ userId, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setCounts({ userId, error: error.message }); });
    return () => { controller.abort(); exportRequest.current?.abort(); };
  }, [allowed, userId]);

  async function download() {
    if (exportRequest.current) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setExporting(true);
    setExportError("");
    try {
      const { data } = await readLeadInbox<LeadListResult>(new URLSearchParams({ view: "export" }), controller.signal);
      if (controller.signal.aborted) return;
      if (!data.length) { setExportError("No leads to export."); return; }
      downloadAdminWorkbook(data.map((row) => ({
        ...row, name: record(row.sender).full_name, product: record(row.item).product_name, date: leadDate(row.created_at),
      })), [["enquiry_number", "Enquiry Number"], ["name", "Name"], ["product", "Product Name"], ["category_name", "Category"],
        ["sub_category_name", "Sub Category"], ["quantity", "Quantity"], ["date", "Created At"]], "Leads.xlsx");
    } catch (error) {
      if (!controller.signal.aborted) setExportError(error instanceof Error ? error.message : "Excel export failed.");
    } finally {
      exportRequest.current = null;
      if (!controller.signal.aborted) setExporting(false);
    }
  }

  if (!allowed) return <p role="alert">Leads are unavailable for your account.</p>;
  const count = counts?.userId === userId ? counts : undefined;
  const columns: DashboardColumn[] = [
    { key: "name", label: "Sender", sortable: false, render: (row) => {
      const sender = record(row.sender);
      const company = record(row.company);
      const slug = text(company.organization_slug);
      return <>
        <div>{text(sender.full_name) || [text(sender.fname), text(sender.lname)].filter(Boolean).join(" ")}</div>
        <div>{enquiryCode(slug) ? <Link href={`/companies/${encodeURIComponent(slug)}`}>{text(company.organization_name)}</Link>
          : text(company.organization_name)}</div>
        <small className="d-block">{text(sender.email)}</small>
      </>;
    } },
    { key: "enquiry_number", label: "Enquiry No", render: (row) => {
      const number = text(row.enquiry_number);
      return enquiryCode(number) ? <Link href={`/lead-detail/${encodeURIComponent(number)}?received=1`}>{number}</Link> : number;
    } },
    { key: "product_name", label: "Product", render: (row) => text(record(row.item).product_name) },
    { key: "quantity", label: "Quantity", render: (row) => text(row.quantity) },
    { key: "created_at", label: "Created", render: (row) => leadDate(row.created_at) },
    { key: "status", label: "Status", sortable: false, render: (row) => <EnquiryStatus status={text(record(row.item).enquiry_status)} /> },
    { key: "action", label: "Action", sortable: false, render: (row) => <AdminRowActions name={text(row.enquiry_number)} actions={[
      { label: "Delete", icon: "bx-trash", danger: true, onClick: () => { setSelected(text(row.enquiry_number)); dialog.current?.showModal(); } },
    ]} /> },
  ];

  return <>
    <DashboardTable key={userId} title="Leads" columns={columns} load={load} renderHeading={(total, headingId) => <>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 id={headingId} className="h4 mb-1">Leads <span className="badge bg-primary">{total}</span></h1>
          <nav aria-label="Breadcrumb" className="small text-secondary"><Link href="/">Home</Link> / Settings / Lead List</nav>
        </div>
        <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={() => void download()}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
      </div>
      {exportError && <p role="alert" className="text-danger">{exportError}</p>}
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
        {cards.map(([key, label, color, image]) => <div className="col mb-4" key={key}>
          <div className="card overflow-hidden position-relative h-100">
            <img src={image} alt="" className="position-absolute top-0 start-0" />
            <div className="card-body ps-4 py-4 position-relative d-flex align-items-center gap-2">
              <div><p className="mb-2">{label}</p><h2 className="mb-0">{count?.data?.[key] || "—"}</h2></div>
              <i className={`bx bxs-user-plus fs-4 rounded-circle border border-${color} p-2 ms-auto text-${color}`} aria-hidden="true" />
            </div>
          </div>
        </div>)}
      </div>
      {count?.error && <p role="status" className="small text-secondary">{count.error}</p>}
    </>} />
    <dialog ref={dialog} className="rounded border-0 p-4 shadow" aria-labelledby="delete-lead-title">
      <h2 id="delete-lead-title" className="h5">Delete Lead</h2>
      <p>Are you sure you want to delete {selected}?</p>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
        <button className="btn btn-danger" type="button" disabled>Delete</button>
      </div>
    </dialog>
  </>;
}
