"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { deletedMailHistoryPath, getMailHistory, mailCount, mailCounters, mailDetailsHref, mailHistoryPath, mailLabel, mailType, validMailCode } from "@/lib/adminMailHistory";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import CatalogDateFilter from "./CatalogDateFilter";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import MailHistoryCounters from "./MailHistoryCounters";
import MailHistoryPreview from "./MailHistoryPreview";
import ReportsBreadcrumb from "./ReportsBreadcrumb";

const emptyDates = { startDate: "", endDate: "" };

export default function AdminMailHistory({ deleted }: { deleted: boolean }) {
  const [dates, setDates] = useState(emptyDates);
  const [list, setList] = useState<LeadListResult>();
  const [preview, setPreview] = useState<LeadRecord>();
  const title = deleted ? "Recently Deleted Mail History" : "Mail History List";
  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    params.set("deleted", String(deleted));
    params.set("startDate", dates.startDate);
    params.set("endDate", dates.endDate);
    const result = await getMailHistory("list", params, signal);
    if (!signal.aborted) setList(result);
    return result;
  }, [dates, deleted]);

  const columns: DashboardColumn[] = [
    { key: "mail_master_list", label: "List", render: (row) => {
      const code = leadText(row.mail_code);
      const label = mailLabel(leadText(row.mail_master_list));
      return validMailCode(code) ? <Link href={mailDetailsHref(code, deleted)}>{label}</Link> : label;
    } },
    { key: "mail_master_type", label: "Type", render: (row) => {
      const type = leadText(row.mail_master_type);
      const color = type === "0" ? "primary" : type === "1" ? "success" : "secondary";
      return <span className={`badge rounded-pill bg-${color}-subtle text-dark border border-${color}-subtle`}>{mailType(type)}</span>;
    } },
    ...mailCounters.filter(([key]) => key !== "not_opened_count").map(([key, label, color]) => ({
      key, label, render: (row: LeadRecord) => <span className={`badge rounded-pill bg-${color}-subtle text-${color}`}>{mailCount(row[key])}</span>,
    })),
    { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
    { key: "action", label: "Action", sortable: false, render: (row) => {
      const code = leadText(row.mail_code);
      return validMailCode(code) && <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPreview(row)}>Preview</button>
        <Link className="btn btn-sm btn-outline-primary" aria-label={`View mail batch ${code}`} href={mailDetailsHref(code, deleted)}>
          <i className="bx bx-show me-1" aria-hidden="true" />
        </Link>
      </div>;
    } },
  ];
  const totals = list && Object.fromEntries(mailCounters.map(([key]) => [
    key, list.data.reduce((sum, row) => sum + mailCount(row[key]), 0),
  ]));

  return <>
    <ReportsBreadcrumb page="Mail History" title={title} />
    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
      <h5 className="mb-0">Mail History{list && <span className="badge bg-primary ms-2">{list.totalRecords}</span>}</h5>
      {deleted ? <Link className="btn btn-primary" href={mailHistoryPath}>Back</Link> :
        <Link className="btn btn-sm btn-outline-primary" href={deletedMailHistoryPath}>Recently Deleted Mail History</Link>}
    </div>
    <MailHistoryCounters values={totals} />
    <div className="card mb-3"><div className="card-body">
      <CatalogDateFilter dates={dates} apply={setDates} />
    </div></div>
    <DashboardTable key={`${dates.startDate}:${dates.endDate}`} title={title} hideHeading columns={columns} load={load} />
    {preview && <MailHistoryPreview row={preview} batch deleted={deleted} close={() => setPreview(undefined)} />}
  </>;
}
