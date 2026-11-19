"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { circularPath, getCircularData, userTypeLabel } from "@/lib/adminCircular";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import AdminRowActions from "./AdminRowActions";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import EmailCircularDetails from "./EmailCircularDetails";
import EmailCircularForm from "./EmailCircularForm";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";
import CircularDeleteDialog from "./CircularDeleteDialog";

function EmailCircularList() {
  const router = useRouter();
  const [list, setList] = useState<LeadListResult>();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<"one" | "bulk">();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    const result = await getCircularData<LeadListResult>("list", params, signal);
    if (!signal.aborted) setList(result);
    return result;
  }, []);

  const columns: DashboardColumn[] = [
    { key: "title", label: "Title", render: (row) => {
      const id = leadText(row.id);
      const title = leadText(row.title);
      return /^\d{1,12}$/.test(id) ? <Link href={`/admin/email_circular_details/${id}`}>{title}</Link> : title;
    } },
    { key: "user_type_name", label: "User Type", render: (row) => userTypeLabel(leadText(row.user_type_name)) },
    { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
    { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
    { key: "action", label: "Action", sortable: false, render: (row) => {
      const id = leadText(row.id);
      return <AdminRowActions name={leadText(row.title) || `circular ${id}`} actions={[
        ...(/^\d{1,12}$/.test(id) ? [{
          label: "View", icon: "bx-show", onClick: () => router.push(`/admin/email_circular_details/${id}`),
        }] : []),
        { label: "Delete", icon: "bx-trash", onClick: () => setConfirm("one") },
      ]} />;
    } },
  ];
  const pageIDs = list?.data.map((row) => leadText(row.id)).filter(Boolean) ?? [];
  const allSelected = pageIDs.length > 0 && pageIDs.every((id) => selected.includes(id));
  const selection: DashboardColumn = {
    key: "select", sortable: false,
    label: <input type="checkbox" aria-label="Select all circulars on this page" checked={allSelected} disabled={!pageIDs.length}
      onChange={() => setSelected((previous) => allSelected ? previous.filter((id) => !pageIDs.includes(id)) : [...new Set([...previous, ...pageIDs])])} />,
    render: (row) => {
      const id = leadText(row.id);
      return <input type="checkbox" aria-label={`Select ${leadText(row.title)}`} checked={selected.includes(id)}
        onChange={() => setSelected((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id])} />;
    },
  };

  async function exportCirculars() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getCircularData<LeadRecord[]>("export");
      downloadAdminWorkbook(rows.map((row) => ({
        ...row,
        user_category_name: leadText(row.user_category_name) || userTypeLabel(leadText(row.user_type_name)),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), [["Title", "title"], ["User Type", "user_category_name"], ["Created", "created_at"], ["Last Update", "updated_at"]],
      "Email Circular Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page="Email Circular" title="Email Circular List" />
    <div className={`d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3 ${styles.heading}`}>
      <h5 className="mb-0">Email Circular{list && <span className="badge bg-primary ms-2">{list.totalRecords}</span>}</h5>
      <div className="d-flex flex-wrap gap-2">
        <Link className="btn btn-sm btn-primary" href="/admin/add_email_circular">
          <i className="bx bxs-plus-square me-1" aria-hidden="true" />Add Email Circular
        </Link>
        <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={exportCirculars}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
        <button className="btn btn-sm btn-danger" type="button" disabled={!selected.length} onClick={() => setConfirm("bulk")}>
          <i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected
        </button>
      </div>
    </div>
    {exportError && <p className="text-danger" role="alert">{exportError}</p>}
    <DashboardTable title="Email Circular List" hideHeading columns={columns} leadingColumn={selection} load={load} />
    {confirm && <CircularDeleteDialog item={confirm === "bulk" ? "the selected circulars" : "this circular"}
      bulk={confirm === "bulk"} close={() => setConfirm(undefined)} />}
  </>;
}

export default function AdminEmailCircular({ view, circularID }: {
  view: "list" | "add" | "edit" | "details"; circularID?: string;
}) {
  if (view === "list") return <EmailCircularList />;
  const title = view === "details" ? "Email Circular Details" : view === "edit" ? "Edit Email Circular" : "Add Email Circular";
  return <>
    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
      <ReportsBreadcrumb page="Email Circular" title={title} />
      <Link href={circularPath} className="btn btn-sm btn-primary mb-3">Back</Link>
    </div>
    {view === "details" && circularID ? <EmailCircularDetails circularID={circularID} /> : <EmailCircularForm circularID={circularID} />}
  </>;
}
