"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { enquiryCode, readAccountEnquiries } from "@/lib/accountEnquiries";
import { leadDate, type LeadListResult } from "@/lib/adminEnquiries";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";
import { downloadAdminWorkbook } from "../admin/exportCategoryMaster";

export function EnquiryStatus({ status }: { status: string }) {
  const open = status === "1";
  const closed = ["2", "3"].includes(status);
  return <span className={`badge ${open ? "bg-success" : closed ? "bg-danger" : "bg-warning-subtle text-warning-emphasis"}`}>
    {open ? "Open" : closed ? "Closed" : "Pending"}
  </span>;
}

const columns: DashboardColumn[] = [
  { key: "enquiry_number", label: "Enquiry No", render: (row) => {
    const code = text(row.enquiry_number);
    return enquiryCode(code) ? <Link href={`/lead-detail/${encodeURIComponent(code)}?my-enquiry=true`}>{code}</Link> : code;
  } },
  { key: "receiver", label: "Receiver", sortable: false, render: (row) => {
    const receiver = record(row.receiver);
    const organization = record(row.organization);
    const name = text(organization.organization_name);
    const slug = text(organization.organization_slug);
    return <>
      {name && (slug && enquiryCode(slug) ? <Link href={`/companies/${encodeURIComponent(slug)}`}>{name}</Link> : <div>{name}</div>)}
      <small className="d-block text-secondary">{text(receiver.full_name) || [text(receiver.fname), text(receiver.lname)].filter(Boolean).join(" ")}</small>
      <small className="d-block text-secondary">{text(receiver.email)}</small>
    </>;
  } },
  { key: "enquiry_product", label: "Product", render: (row) => text(record(row.item).product_name) },
  { key: "quantity", label: "Quantity", render: (row) => text(row.quantity) },
  { key: "created_at", label: "Created", render: (row) => leadDate(row.created_at) },
  { key: "status", label: "Status", sortable: false, render: (row) => <EnquiryStatus status={text(record(row.item).enquiry_status)} /> },
];

const load = (query: URLSearchParams, signal: AbortSignal) => readAccountEnquiries<LeadListResult>(query, signal);
const summary = [
  ["enquirytotal", "No. of Enquiries", "success", "/element-02.svg"],
  ["enquiryopen", "Open Enquiries", "warning", "/element-04.svg"],
  ["enquiryclosed", "Closed Enquiries", "primary", "/element-01.svg"],
] as const;

export function MyEnquiriesTable() {
  return <DashboardTable title="My Enquiries" hideHeading columns={columns} load={load} initialSortDirection="ASC" />;
}

export function MyEnquiriesPage() {
  const { user } = useAuth();
  const id = text(user?.id);
  const [counts, setCounts] = useState<{ id: string; data?: Record<string, string>; error?: string }>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void readAccountEnquiries<Record<string, string>>(new URLSearchParams({ view: "counts" }), controller.signal)
      .then((data) => { if (!controller.signal.aborted) setCounts({ id, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setCounts({ id, error: error.message }); });
    return () => { controller.abort(); exportRequest.current?.abort(); };
  }, [id]);

  async function exportEnquiries() {
    if (exportRequest.current) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setExporting(true);
    setExportError("");
    try {
      const { data } = await readAccountEnquiries<LeadListResult>(new URLSearchParams({ view: "export" }), controller.signal);
      if (controller.signal.aborted) return;
      if (!data.length) { setExportError("There are no enquiries to export."); return; }
      downloadAdminWorkbook(data.map((row) => ({
        ...row, product_name: text(record(row.item).product_name), created: leadDate(row.created_at),
      })), [["Enquiry Number", "enquiry_number"], ["Product Name", "product_name"], ["Category", "category_name"],
        ["Sub Category", "sub_category_name"], ["Quantity", "quantity"], ["Created At", "created"]], "Enquiries.xlsx");
    } catch (error) {
      if (!controller.signal.aborted) setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      exportRequest.current = null;
      if (!controller.signal.aborted) setExporting(false);
    }
  }

  const current = counts?.id === id ? counts : undefined;
  return <>
    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
      <div><h1 className="h4 mb-1">Enquiry</h1><div className="small text-secondary"><Link href="/">Home</Link> / Settings / Enquiry List</div></div>
      <button type="button" className="btn btn-primary btn-sm" disabled={exporting} onClick={() => { void exportEnquiries(); }}>
        <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}</button>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
      {summary.map(([key, label, color, image]) => <div className="col mb-4" key={key}>
        <div className="card overflow-hidden position-relative h-100">
          <img src={image} alt="" className="position-absolute top-0 start-0" />
          <div className="card-body ps-4 py-4 position-relative d-flex align-items-center gap-2">
            <div><p className="mb-2">{label}</p><h2 className="mb-0">{current?.data?.[key] || "—"}</h2></div>
            <i className={`bx bxs-user-plus fs-4 rounded-circle border border-${color} p-2 ms-auto text-${color}`} aria-hidden="true" />
          </div>
        </div>
      </div>)}
    </div>
    {current?.error && <p role="status" className="small text-secondary">{current.error}</p>}
    <MyEnquiriesTable key={id} />
  </>;
}
