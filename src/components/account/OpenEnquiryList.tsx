"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { canBrowseOpenEnquiries, canReadOwnOpenEnquiries, readEnquiryDirectory } from "@/lib/accountEnquiryDirectory";
import { leadDate, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { displayText as text } from "@/lib/userDashboard";
import AdminRowActions from "../admin/AdminRowActions";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";
import { downloadAdminWorkbook } from "../admin/exportCategoryMaster";

const fields: DashboardColumn[] = [
  { key: "name", label: "Name", render: (row) => <>{text(row.name)}<br />{text(row.email)}</> },
  { key: "title", label: "Title", render: (row) => text(row.title) },
  { key: "description", label: "Description", render: (row) => <div className="text-break">{text(row.description)}</div> },
  { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
  { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
  { key: "is_home", label: "Show Home", sortable: false, render: (row) => row.is_home ? "Yes" : "No" },
];

export default function OpenEnquiryList({ scope }: { scope: "mine" | "all" }) {
  const { user } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const exportRequest = useRef<AbortController | null>(null);
  const title = scope === "mine" ? "My Open Enquiries" : "Open Enquiries";

  useEffect(() => () => exportRequest.current?.abort(), []);

  const load = useCallback((query: URLSearchParams, signal: AbortSignal) => {
    query.set("view", "open");
    query.set("scope", scope);
    return readEnquiryDirectory<LeadListResult>(query, signal);
  }, [scope]);

  async function download() {
    if (exportRequest.current) return;
    const controller = new AbortController();
    exportRequest.current = controller;
    setExporting(true);
    setError("");
    try {
      const rows = await readEnquiryDirectory<LeadRecord[]>(new URLSearchParams({ view: "export", scope }), controller.signal);
      if (controller.signal.aborted) return;
      if (!rows.length) { setError("No enquiries to export."); return; }
      downloadAdminWorkbook(rows, [["name", "User Name"], ["title", "Title"], ["description", "Description"]], `${title}.xlsx`);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Excel export failed.");
    } finally {
      exportRequest.current = null;
      if (!controller.signal.aborted) setExporting(false);
    }
  }

  if (!user || !(scope === "mine" ? canReadOwnOpenEnquiries(user) : canBrowseOpenEnquiries(user))) {
    return <p role="alert">This section is unavailable for your account.</p>;
  }

  const columns: DashboardColumn[] = [...fields, {
    key: "action", label: "Action", sortable: false, render: (row) => <AdminRowActions name={text(row.title)} actions={[
      { label: "View", icon: "bx-eye", onClick: () => router.push(`/open-enquiry/${row.id}${scope === "all" ? "?type=1" : ""}`) },
    ]} />,
  }];

  return <>
    {error && <p className="text-danger" role="alert">{error}</p>}
    <DashboardTable title={title} columns={columns} load={load} renderHeading={(total, headingId) =>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1" id={headingId}>{title} <span className="badge bg-primary">{total}</span></h1>
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb mb-0"><li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{title}</li></ol>
          </nav>
        </div>
        <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={() => void download()}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
      </div>} />
  </>;
}
