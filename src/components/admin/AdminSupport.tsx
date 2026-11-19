"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { getSupportData, supportPriorities, supportStatuses, type SupportList, type SupportOption } from "@/lib/adminSupport";
import CatalogDateFilter from "./CatalogDateFilter";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import SupportDialog, { type SupportAction } from "./SupportDialog";
import TicketCategoryActions from "./TicketCategoryActions";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";

const defaultFilters = { title: "", status: "", priority: "", category: "" };
const initialDates = { startDate: "", endDate: "" };
const statusOptions = supportStatuses.map((name, index) => ({ name, id: String(index) }));
const priorityOptions = supportPriorities.map((name) => ({ name, id: name.toLowerCase() }));

function supportOptions(options: SupportOption[]) {
  return options.map(({ id, name }) => <option key={id} value={id}>{name}</option>);
}

function SupportFilters({ categories, apply }: { categories: SupportOption[]; apply: (params: string) => void }) {
  const [draft, setDraft] = useState(defaultFilters);
  const [dates, setDates] = useState(initialDates);
  const [calendarKey, setCalendarKey] = useState(0);
  return <div className="card mb-3"><div className="card-body">
    <div className="row mb-3">
      <label className="col-md-6 mb-3">
        <span className="form-label d-block">Title</span>
        <input className="form-control" placeholder="Enter Title" value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      </label>
      {([
        ["status", "Status", "--Status--", statusOptions],
        ["priority", "Priority", "--Priority--", priorityOptions],
        ["category", "Categories", "All", categories],
      ] as const).map(([field, label, emptyLabel, options]) => (
        <label className="col-md-6 mb-3" key={field}>
          <span className="form-label d-block">{label}</span>
          <select className="form-select" value={draft[field]}
            onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}>
            <option value="">{emptyLabel}</option>{supportOptions(options)}
          </select>
        </label>
      ))}
      <div className="col-md-8">
        <CatalogDateFilter key={calendarKey} dates={initialDates} onDraftChange={setDates} />
      </div>
      <div className="col-12 mt-2 d-flex justify-content-end gap-2">
        <button className="btn btn-primary" type="button" onClick={() => {
          apply(new URLSearchParams({ ...draft, ...dates, dateRange: dates.startDate ? "customrange" : "" }).toString());
        }}>Apply</button>
        <button className="btn btn-secondary" type="button" onClick={() => {
          setDraft(defaultFilters);
          setDates(initialDates);
          setCalendarKey((key) => key + 1);
          apply("");
        }}>Clear</button>
      </div>
    </div>
  </div></div>;
}

function SupportForm({ tickets, row, categories, buyers, reset }: {
  tickets: boolean; row?: LeadRecord; categories: SupportOption[]; buyers: SupportOption[]; reset: () => void;
}) {
  const editing = Boolean(row);
  return <form className="card" onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
    <div className="card-body">
      <h5 className="card-title mb-3">{editing ? "Edit" : "Add"} {tickets ? "Ticket" : "Ticket Category"}</h5>
      {tickets ? <>
        <label className="d-block mb-3"><span className="form-label d-block required">On Behalf Of</span>
          <select className="form-control" defaultValue="" required>
            <option value="">Select here</option>{supportOptions(buyers)}
          </select>
        </label>
        <label className="d-block mb-3"><span className="form-label d-block required">Title</span>
          <input className="form-control" type="text" placeholder="Title" required />
        </label>
        <label className="d-block mb-3"><span className="form-label d-block">Priority</span>
          <select className="form-select" defaultValue="">
            <option value="">Select here</option><option value="normal">Normal</option><option value="high">High</option>
          </select>
        </label>
        <label className="d-block mb-3"><span className="form-label d-block required">Category</span>
          <select className="form-control" defaultValue="" required>
            <option value="">Select Category</option>{supportOptions(categories)}
          </select>
        </label>
        <label className="d-block mb-3"><span className="form-label d-block required">Message</span>
          <textarea className="form-control" placeholder="message" required />
        </label>
        <label className="d-block mb-3"><span className="form-label d-block">Attachment</span>
          <input className="form-control" type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" />
        </label>
      </> : <>
        <label className="d-block mb-3"><span className="form-label d-block required">Name</span>
          <input className="form-control" type="text" placeholder="Name" defaultValue={leadText(row?.name)} required />
        </label>
        <label className="d-block mb-3"><span className="form-label d-block required">Email</span>
          <input className="form-control" type="email" placeholder="Email" defaultValue={leadText(row?.email)} required />
        </label>
        <label className="d-block mb-3"><span className="form-label d-block required">Status</span>
          <select className="form-select" defaultValue={leadText(row?.status) || "1"}>
            <option value="1">Active</option><option value="0">Inactive</option>
          </select>
        </label>
      </>}
      <div className="d-flex justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>{editing ? "Cancel" : "Reset"}</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled>{editing ? "Update" : "Save"}</button>
      </div>
    </div>
  </form>;
}

export default function AdminSupport({ kind }: { kind: SupportList }) {
  const tickets = kind === "tickets";
  const title = tickets ? "Ticket" : "Ticket Category";
  const [form, setForm] = useState<{ key: number; row?: LeadRecord }>({ key: 0 });
  const [filters, setFilters] = useState("");
  const [categories, setCategories] = useState<SupportOption[]>([]);
  const [buyers, setBuyers] = useState<SupportOption[]>([]);
  const [list, setList] = useState<LeadListResult>();
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<SupportAction>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const formArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tickets) return;
    const controller = new AbortController();
    void getSupportData<SupportOption[]>("categories", undefined, controller.signal).then(setCategories).catch(() => {});
    void getSupportData<SupportOption[]>("buyers", undefined, controller.signal).then(setBuyers).catch(() => {});
    return () => controller.abort();
  }, [tickets]);

  const openForm = (row?: LeadRecord) => {
    setForm((previous) => ({ key: previous.key + 1, row }));
    formArea.current?.scrollIntoView({ block: "nearest" });
  };

  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    for (const [key, value] of new URLSearchParams(filters)) query.set(key, value);
    const result = await getSupportData<LeadListResult>(kind, query, signal);
    if (!signal.aborted) setList(result);
    return result;
  }, [filters, kind]);

  const textColumn = (key: string, label: string): DashboardColumn => ({ key, label, render: (row) => leadText(row[key]) });
  const categoryColumns: DashboardColumn[] = [
    textColumn("name", "Name"),
    textColumn("email", "Email"),
    { key: "status", label: "Status", sortable: false, render: (row) => <div className="form-check form-switch">
      <input type="checkbox" role="switch" className="form-check-input" aria-label={`Status of ${leadText(row.name)}`}
        checked={leadText(row.status) === "1"} onChange={() => setAction("Change Status")} />
    </div> },
    { key: "action", label: "Action", sortable: false, render: (row) => <TicketCategoryActions name={leadText(row.name)}
      edit={() => openForm(row)} remove={() => setAction("Delete")} /> },
  ];
  const ticketColumns: DashboardColumn[] = [
    { key: "ticket_id", label: "Ticket ID", render: (row) => <Link href={`/admin/ticket/view/${encodeURIComponent(leadText(row.id))}`}>{leadText(row.ticket_id)}</Link> },
    textColumn("title", "Title"),
    { key: "full_name", label: "Created By", render: (row) => <>
      {leadText(row.full_name) && <div><i className="bx bx-user me-1" />{leadText(row.full_name)}</div>}
      {leadText(row.email) && <div><i className="bx bx-envelope me-1" />{leadText(row.email)}</div>}
    </> },
    { key: "user_id", label: "Added By", sortable: false, render: (row) => <span className="badge bg-success">{leadText(row.user_id) === "0" ? "Front" : "Admin"}</span> },
    { key: "last_reply_date", label: "Last Reply", render: (row) => leadDate(row.last_reply_date) },
    textColumn("priority", "Priority"),
    { key: "category_name", label: "Ticket Category", render: (row) => <span className="badge bg-info">{leadText(row.category_name)}</span> },
    { key: "action", label: "Action", sortable: false, render: (row) => <div className="d-flex gap-2">
      {["0", "1"].includes(leadText(row.status)) && <>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAction("Resolve")}>Resolve</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setAction("Cancel")}>Cancel</button>
      </>}
      <button type="button" className="btn btn-dark btn-sm" aria-label="Delete ticket" onClick={() => setAction("Delete")}>
        <i className="bx bx-trash" aria-hidden="true" />
      </button>
    </div> },
  ];

  const pageIds = list?.data.map((row) => leadText(row.id)).filter(Boolean) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const selectionColumn: DashboardColumn = { key: "select", sortable: false,
    label: <input type="checkbox" aria-label="Select all categories on this page" checked={allSelected} disabled={!pageIds.length || !list}
      onChange={() => setSelected((previous) => allSelected ? previous.filter((id) => !pageIds.includes(id)) : [...new Set([...previous, ...pageIds])])} />,
    render: (row) => {
      const id = leadText(row.id);
      return <input type="checkbox" aria-label={`Select ${leadText(row.name)}`} checked={selected.includes(id)}
        onChange={() => setSelected((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id])} />;
    },
  };

  async function exportItems() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getSupportData<LeadRecord[]>(kind, new URLSearchParams({ export: "1" }));
      const columns: [string, string][] = tickets ?
        [["Ticket Id", "ticket_id"], ["Title", "title"], ["Priority", "priority"], ["Added By", "added_by"]] :
        [["Name", "name"], ["Email", "email"]];
      downloadAdminWorkbook(rows.map((row) => ({
        ...row,
        getStatus: leadText(row.getStatus) || (tickets ? supportStatuses[Number(row.status)] : leadText(row.status) === "1" ? "Active" : "Inactive"),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), [...columns, ["Status", "getStatus"], ["Created", "created_at"], ["Last Update", "updated_at"]],
      tickets ? "Ticket Export.xlsx" : "Ticket Categories Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page="Support System" title={title} />
    <div className={`d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3 ${styles.heading}`}>
      <h5 className="mb-0">{title}{list && <span className="badge bg-primary ms-2">{list.totalRecords}</span>}</h5>
      <div className="d-flex gap-2 flex-wrap">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => openForm()}>
          <i className="bx bxs-plus-square me-1" />Add {title}
        </button>
        <button type="button" className="btn btn-sm btn-primary" disabled={exporting} onClick={exportItems}>
          <i className="bx bx-download me-1" />{exporting ? "Exporting…" : "Excel"}
        </button>
        {!tickets && <button type="button" className="btn btn-sm btn-danger" disabled={!selected.length} onClick={() => setAction("Delete Selected")}>
          <i className="bx bx-trash me-1" />Delete Selected
        </button>}
      </div>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    <div className="row">
      <div className="col-md-4" ref={formArea}>
        <SupportForm key={form.key} tickets={tickets} row={form.row} categories={categories} buyers={buyers} reset={() => openForm()} />
      </div>
      <div className="col-md-8">
        {tickets && <SupportFilters categories={categories} apply={setFilters} />}
        <DashboardTable key={filters} title={title} hideHeading load={load}
          columns={tickets ? ticketColumns : categoryColumns} leadingColumn={tickets ? undefined : selectionColumn} />
      </div>
    </div>
    {action && <SupportDialog action={action} close={() => setAction(undefined)} />}
  </>;
}
