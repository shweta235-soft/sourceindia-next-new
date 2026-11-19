"use client";

import Link from "next/link";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { activityStatus, activityUserType, getUserActivityData, type ActivityCounts } from "@/lib/adminUserActivity";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./user-activity.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const stats = [
  { key: "UserInactiveStatus", label: "Inactive", color: "primary", icon: "bxs-user-x", fallback: "#0d6efd" },
  { key: "UserActiveStatus", label: "Active", color: "warning", icon: "bxs-user-check", fallback: "#ffc107" },
  { key: "UserApprove", label: "Approved", color: "success", icon: "bxs-user-plus", fallback: "#198754" },
  { key: "UserDeleted", label: "Deleted", color: "danger", icon: "bxs-trash", fallback: "#dc3545" },
] as const;

const exportColumns: [string, string][] = [
  ["Organization Name", "company_name"], ["Fname", "user_fname"], ["Lname", "user_lname"], ["Email", "user_email"],
  ["Mobile", "user_mobile"], ["Is Seller", "user_type"], ["Created", "created_at"], ["Last Update", "updated_at"],
];

function ActivityPanel({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  return <div className="card">
    <button className="card-header bg-white d-flex justify-content-between align-items-center w-100 text-start border-0"
      type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>
      <span className="fw-bolder">{label}</span>
      <i className={`bx ${expanded ? "bx-chevron-down" : "bx-chevron-right"}`} aria-hidden="true" />
    </button>
    <div id={id} hidden={!expanded}>{children}</div>
  </div>;
}

function UserActivitySummary() {
  const [result, setResult] = useState<{ counts?: ActivityCounts; error?: boolean; colors?: string[] }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getUserActivityData<ActivityCounts>("counts", undefined, controller.signal).then((counts) => {
      if (!controller.signal.aborted) {
        const theme = getComputedStyle(document.documentElement);
        const colors = stats.map(({ color, fallback }) => theme.getPropertyValue(`--bs-${color}`).trim() || fallback);
        setResult({ counts, colors });
      }
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ error: true });
    });
    return () => controller.abort();
  }, [attempt]);

  const counts = result?.counts;
  const values = stats.map(({ key }) => counts?.[key]);
  const chartValues = values.map((value) => value ?? 0);
  const completeCounts = values.every((value) => value !== undefined);
  const hasChartData = completeCounts && chartValues.some((value) => value > 0);

  return <>
    {!result && <p role="status">Loading activity counts…</p>}
    {result?.error && <p role="alert">Activity counts could not be loaded. <button type="button" className="btn btn-link btn-sm" onClick={() => {
      setResult(undefined);
      setAttempt((previous) => previous + 1);
    }}>Retry</button></p>}
    <div className="row gy-3 mb-3">
      <div className="col-md-6"><ActivityPanel label="Count">
        <div className="row p-3">
          {stats.map(({ key, label, color, icon }) => <div className="col-sm-6" key={key}>
            <div className="card radius-10 mb-3"><div className="card-body bg-light shadow-sm rounded">
              <div className="d-flex align-items-center">
                <div><p className="mb-0 text-secondary">{label}</p><h4 className="my-1">{counts?.[key] ?? "—"}</h4></div>
                <div className={`widgets-icons bg-${color}-subtle text-${color} ms-auto ${styles.statIcon}`}>
                  <i className={`bx ${icon}`} aria-hidden="true" />
                </div>
              </div>
            </div></div>
          </div>)}
        </div>
      </ActivityPanel></div>
      <div className="col-md-6"><ActivityPanel label="Pie Chart">
        <div className="card-body text-center">
          <div className="mb-3 d-flex flex-wrap justify-content-center gap-2">
            {stats.map(({ key, color, label }) => <span className={`badge bg-${color}`} key={key}>{label}: {counts?.[key] ?? "—"}</span>)}
          </div>
          {hasChartData ? <div className={styles.chart}>
            <Pie aria-label="User activity counts by status" role="img" data={{
              labels: stats.map(({ label }) => label),
              datasets: [{ data: chartValues, backgroundColor: result?.colors, borderWidth: 1 }],
            }} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          </div> : counts && <p className="text-muted mb-0">{completeCounts ? "No activity counts to chart." : "Activity counts are incomplete."}</p>}
        </div>
      </ActivityPanel></div>
    </div>
  </>;
}

const columns: DashboardColumn[] = [
  { key: "user_company_name", label: "Lead Number", render: (row) => {
    const company = leadText(row.user_company_name);
    const slug = leadText(row.user_company_slug);
    return <>
      {company && <h6 className="username">{slug && slug !== "." && slug !== ".." ?
        <Link href={`/companies/${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer">{company}</Link> : company}</h6>}
      {([["user_name", "bx-user"], ["user_email", "bx-envelope"], ["user_mobile", "bx-mobile"]] as const).map(([field, icon]) =>
        leadText(row[field]) && <div key={field}><i className={`bx ${icon} me-1`} aria-hidden="true" />{leadText(row[field])}</div>
      )}
    </>;
  } },
  { key: "user_status", label: "Status", render: (row) => <span className="badge bg-primary">{activityStatus(row.user_status)}</span> },
  { key: "user_is_seller", label: "Is Seller", render: (row) => <span className="badge bg-primary">{activityUserType(row.user_is_seller)}</span> },
  { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
  { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
];

export default function AdminUserActivities() {
  const [total, setTotal] = useState<number>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    const list = await getUserActivityData<LeadListResult>("list", params, signal);
    if (!signal.aborted) setTotal(list.totalRecords);
    return list;
  }, []);

  async function exportActivities() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getUserActivityData<LeadRecord[]>("export");
      downloadAdminWorkbook(rows.map((row) => ({
        ...row, company_name: leadText(row.company_name) || leadText(row.user_company_name),
        user_type: leadText(row.user_type) || activityUserType(row.user_is_seller),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), exportColumns, "User Activity Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page="User Activities" title="User Activities List" />
    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
      <h5 className="mb-0">User Activities{total !== undefined && <span className="badge bg-primary ms-2">{total}</span>}</h5>
      <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={exportActivities}>
        <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
      </button>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    <UserActivitySummary />
    <DashboardTable title="User Activities List" hideHeading columns={columns} load={load} renderSerial={(row, number) => {
      const id = leadText(row.user_id);
      return /^\d{1,12}$/.test(id) ? <Link href={`/admin/user-activity-details/${id}`}
        aria-label={`View activity details for ${leadText(row.user_name) || `user ${id}`}`}>{number}</Link> : number;
    }} />
  </>;
}
