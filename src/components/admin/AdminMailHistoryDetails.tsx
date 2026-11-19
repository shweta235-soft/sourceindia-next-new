"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { leadDate, leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { deletedMailHistoryPath, getMailHistory, mailCount, mailDeliveryStatuses, mailHistoryPath, mailLabel, mailType } from "@/lib/adminMailHistory";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import MailHistoryCounters from "./MailHistoryCounters";
import MailHistoryPreview from "./MailHistoryPreview";
import ReportsBreadcrumb from "./ReportsBreadcrumb";

export default function AdminMailHistoryDetails({ mailCode, deleted }: { mailCode: string; deleted: boolean }) {
  const [status, setStatus] = useState("all");
  const [summary, setSummary] = useState<LeadRecord>();
  const [preview, setPreview] = useState<LeadRecord>();

  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    params.set("code", mailCode);
    params.set("deleted", String(deleted));
    params.set("statusFilter", status);
    const result = await getMailHistory("detail", params, signal);
    if (!signal.aborted) setSummary(result.summary);
    return result;
  }, [mailCode, deleted, status]);

  const columns: DashboardColumn[] = [
    { key: "user_name", label: "Name", render: (row) => <>{mailLabel(leadText(row.user_name))}<br />
      {leadText(row.user_email || row.mail) || "-"}</> },
    { key: "organization_name", label: "Company", render: (row) => leadText(row.organization_name) || "-" },
    { key: "mail_type", label: "Mail Type", render: (row) => <span className="text-nowrap">{leadText(row.mail_type_label) || "-"}</span> },
    { key: "delivery_status", label: "Status", render: (row) => {
      const value = leadText(row.delivery_status);
      const color = value.toLowerCase() === "success" ? "success" : value.toLowerCase() === "failed" ? "danger" : "warning";
      return <span className={`badge rounded-pill bg-${color}-subtle text-${color}`}>{value || "-"}</span>;
    } },
    { key: "is_open", label: "Opened", render: (row) => <span className={`badge rounded-pill ${row.is_open === "1" ?
      "bg-success-subtle text-success" : "bg-secondary-subtle text-dark"}`}>{mailCount(row.open_count)}</span> },
    { key: "opened_at", label: "Opened At", render: (row) => <span className="text-nowrap">{leadDate(row.opened_at) || "-"}</span> },
    { key: "country", label: "Location", render: (row) => [row.country, row.state, row.city].map(leadText).filter(Boolean).join(", ") || "-" },
    { key: "mail_send_time", label: "Mail Send Time", render: (row) => <span className="text-nowrap">{leadDate(row.mail_send_time) || "-"}</span> },
    { key: "action", label: "Action", sortable: false, render: (row) => <div className="d-flex flex-wrap gap-2">
      <button className="btn btn-sm btn-outline-primary" type="button" aria-label="Preview email" onClick={() => setPreview(row)}>
        <i className="bx bx-show" aria-hidden="true" />
      </button>
      {!deleted && row.is_failed === "1" && <button className="btn btn-sm btn-outline-success" type="button" aria-label="Resend email" disabled>
        <i className="bx bx-mail-send" aria-hidden="true" />
      </button>}
    </div> },
  ];

  return <>
    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
      <ReportsBreadcrumb page="Mail History" title="Mail History Details" />
      <Link className="btn btn-sm btn-primary mb-3" href={deleted ? deletedMailHistoryPath : mailHistoryPath}>Back</Link>
    </div>
    <div className="card mb-4"><div className="card-body"><div className="row g-3 align-items-center">
      <div className="col-md-6">
        <small className="text-muted d-block mb-1">List</small>
        <div className="fw-semibold">{mailLabel(leadText(summary?.mail_master_list))}</div>
      </div>
      <div className="col-md-6">
        <small className="text-muted d-block mb-1">Type</small>
        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <span className="badge rounded-pill bg-primary-subtle text-dark border border-primary-subtle">
            {mailType(leadText(summary?.mail_master_type))}
          </span>
          {!deleted && mailCount(summary?.failed_count) > 0 &&
            <button className="btn btn-sm btn-outline-danger" type="button" disabled>Resend Failed</button>}
        </div>
      </div>
    </div></div></div>
    <MailHistoryCounters values={summary} />
    <div className="card mb-3"><div className="card-body"><div className="row g-2 align-items-center">
      <div className="col-12 col-sm-6 col-md-4 col-lg-3">
        <label htmlFor="statusFilter" className="form-label mb-1">Status Filter</label>
        <select id="statusFilter" className="form-select form-select-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          {mailDeliveryStatuses.map((value) => <option value={value} key={value}>{mailLabel(value)}</option>)}
        </select>
      </div>
    </div></div></div>
    <DashboardTable key={status} title="Mail History Details" hideHeading columns={columns} load={load} />
    {preview && <MailHistoryPreview row={preview} deleted={deleted} close={() => setPreview(undefined)} />}
  </>;
}
