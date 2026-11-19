"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { getAdminSubmissions, registrationCategories, type LocationOption, type SubmissionKind } from "@/lib/adminSubmissions";
import AdminRowActions from "./AdminRowActions";
import CatalogDateFilter from "./CatalogDateFilter";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";
import modalStyles from "./product-keywords.module.css";

const emptyDates = { startDate: "", endDate: "" };
const emptyFilters = { registrationName: "", registrationEmail: "", registrationMobile: "", state: "", city: "", registrationCategory: "" };
const pages = {
  contacts: {
    heading: "Contact List", section: "Contacts", activeTitle: "Contact Us", deletedTitle: "Recently Deleted Contact Us",
    activePath: "/admin/contacts-list", deletedPath: "/admin/contact-remove-list", deletedLabel: "Recently Deleted Contact",
    noun: "contact", filename: "Contacts Export.xlsx",
    exportColumns: [["Fname", "fname"], ["Lname", "lname"], ["Email", "email"], ["Subject", "subject"]],
  },
  registrations: {
    heading: "Event 2024 Registrations", section: "Registrations", activeTitle: "Registration List",
    deletedTitle: "Recently Deleted Event 2024 Registrations", activePath: "/admin/registrations-list",
    deletedPath: "/admin/registrations-remove-list", deletedLabel: "Recently Deleted Registration",
    noun: "registration", filename: "Event_2023_registration.xlsx",
    exportColumns: [["Name", "name"], ["Email", "email"], ["Phone", "mobile"], ["State Name", "state_name"], ["City Name", "city_name"]],
  },
} satisfies Record<SubmissionKind, {
  heading: string; section: string; activeTitle: string; deletedTitle: string; activePath: string;
  deletedPath: string; deletedLabel: string; noun: string; filename: string; exportColumns: [string, string][];
}>;

type Confirmation = "Remove" | "Restore" | "Delete" | "Delete Selected";

function SubmissionConfirmation({ action, noun, close }: { action: Confirmation; noun: string; close: () => void }) {
  const titleID = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const bulk = action === "Delete Selected";
  const deleting = action === "Delete" || bulk;
  const title = bulk ? "Bulk Deletion" : deleting ? "Deletion" : action;
  const message = deleting ? `delete ${bulk ? `the selected ${noun}s` : `this ${noun}`}` :
    action === "Restore" ? `restore this deleted ${noun}` : `remove this ${noun} from the list`;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header">
        <h5 id={titleID} className="modal-title">Confirm {title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">Are you sure you want to {message}?</div>
      <div className="modal-footer justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className={`btn ${deleting ? "btn-danger" : "btn-warning"}`} disabled>{action}</button>
      </div>
    </div></div>
  </dialog>;
}

function useLocationOptions(action: "states" | "cities", state = "") {
  const [result, setResult] = useState<{ state: string; options?: LocationOption[]; failed?: boolean }>();
  useEffect(() => {
    if (action === "cities" && !state) return;
    const controller = new AbortController();
    void getAdminSubmissions<LocationOption[]>(new URLSearchParams({ action, state }), controller.signal).then((options) => {
      if (!controller.signal.aborted) setResult({ state, options });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ state, failed: true });
    });
    return () => controller.abort();
  }, [action, state]);
  return result?.state === state ? result : undefined;
}

function RegistrationFilters({ apply }: { apply: (query: string) => void }) {
  const [draft, setDraft] = useState(emptyFilters);
  const states = useLocationOptions("states");
  const cities = useLocationOptions("cities", draft.state);
  return <form className="card mb-3" onSubmit={(event) => {
    event.preventDefault();
    apply(new URLSearchParams(draft).toString());
  }}><div className="card-body"><div className="row">
    {([["registrationName", "Name"], ["registrationEmail", "Email"], ["registrationMobile", "Mobile"]] as const).map(([key, label]) =>
      <label className="col-md-4 mb-3" key={key}>
        <span className="form-label d-block">{label}</span>
        <input className="form-control" value={draft[key]} placeholder={`Enter ${label}`}
          onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
      </label>
    )}
    <label className="col-md-4 mb-3"><span className="form-label d-block">State</span>
      <select className="form-control" value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value, city: "" })}>
        <option value="">All</option>
        {states?.options?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
      {states?.failed && <span role="alert" className="text-danger">States could not be loaded.</span>}
    </label>
    <label className="col-md-4 mb-3"><span className="form-label d-block">City</span>
      <select className="form-control" value={draft.city} disabled={!draft.state || !cities?.options}
        onChange={(event) => setDraft({ ...draft, city: event.target.value })}>
        <option value="">All</option>
        {cities?.options?.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
      {cities?.failed && <span role="alert" className="text-danger">Cities could not be loaded.</span>}
    </label>
    <label className="col-md-4 mb-3"><span className="form-label d-block">Category</span>
      <select className="form-control" value={draft.registrationCategory} onChange={(event) => setDraft({ ...draft, registrationCategory: event.target.value })}>
        <option value="">-- Select --</option>
        {registrationCategories.map((label) => <option key={label} value={label.toLowerCase()}>{label}</option>)}
      </select>
    </label>
    <div className="col-12 d-flex justify-content-end gap-2">
      <button type="submit" className="btn btn-primary">Apply</button>
      <button type="button" className="btn btn-secondary" onClick={() => { setDraft(emptyFilters); apply(""); }}>Clear</button>
    </div>
  </div></div></form>;
}

function textColumn(key: string, label: string, format = leadText): DashboardColumn {
  return { key, label, render: (row) => format(row[key]) };
}

const contactColumns = [textColumn("full_name", "User"), textColumn("email", "Email"), textColumn("subject", "Subject")];
const registrationColumns: DashboardColumn[] = [
  textColumn("category", "Category"),
  { key: "name", label: "Info", render: (row) => <>
    {leadText(row.name) && <div><strong>Name:</strong> {leadText(row.name)}</div>}
    {leadText(row.email) && <div><strong>Email:</strong> {leadText(row.email)}</div>}
    {leadText(row.mobile) && <div><strong>Mobile:</strong> {leadText(row.mobile)}</div>}
  </> },
  { key: "state_name", label: "Location", render: (row) => <>
    {leadText(row.state_name) && <div><strong>State:</strong> {leadText(row.state_name)}</div>}
    {leadText(row.city_name) && <div><strong>City:</strong> {leadText(row.city_name)}</div>}
  </> },
  textColumn("designation", "Designation"), textColumn("organization", "Organization"),
];

export default function AdminSubmissionList({ kind, deleted = false }: { kind: SubmissionKind; deleted?: boolean }) {
  const config = pages[kind];
  const registrations = kind === "registrations";
  const title = deleted ? config.deletedTitle : config.activeTitle;
  const [filters, setFilters] = useState("");
  const [list, setList] = useState<LeadListResult>();
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<Confirmation>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    for (const [key, value] of new URLSearchParams(filters)) params.set(key, value);
    params.set("kind", kind);
    params.set("deleted", String(deleted));
    const result = await getAdminSubmissions<LeadListResult>(params, signal);
    if (!signal.aborted) setList(result);
    return result;
  }, [filters, kind, deleted]);

  const columns: DashboardColumn[] = [
    ...(registrations ? registrationColumns : contactColumns),
    textColumn("created_at", "Created At", leadDate), textColumn("updated_at", "Updated At", leadDate),
    { key: "action", label: "Action", sortable: false, render: (row) => <AdminRowActions
      name={leadText(row[registrations ? "name" : "full_name"]) || `${config.noun} ${leadText(row.id)}`}
      actions={deleted ? [
        { label: "Restore", icon: "bx-windows", onClick: () => setAction("Restore") },
        { label: "Delete", icon: "bx-trash", onClick: () => setAction("Delete") },
      ] : [{ label: "Delete", icon: "bx-trash", onClick: () => setAction("Remove") }]} /> },
  ];

  const pageIDs = list?.data.map((row) => leadText(row.id)).filter(Boolean) ?? [];
  const allSelected = pageIDs.length > 0 && pageIDs.every((id) => selected.includes(id));
  const leadingColumn: DashboardColumn = {
    key: "selection", sortable: false,
    label: <input type="checkbox" aria-label="Select all records on this page" checked={allSelected} disabled={!pageIDs.length}
      onChange={() => setSelected((previous) => allSelected ? previous.filter((id) => !pageIDs.includes(id)) : [...new Set([...previous, ...pageIDs])])} />,
    render: (row) => {
      const id = leadText(row.id);
      return <input type="checkbox" aria-label={`Select ${config.noun} ${id}`} checked={selected.includes(id)}
        onChange={() => setSelected((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id])} />;
    },
  };

  async function exportRows() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await getAdminSubmissions<LeadRecord[]>(new URLSearchParams({ kind, deleted: String(deleted), action: "export" }));
      downloadAdminWorkbook(rows.map((row) => ({ ...row, created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at) })),
        [...config.exportColumns, ["Created", "created_at"], ["Last Update", "updated_at"]], config.filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <ReportsBreadcrumb page={config.section} title={title} />
    <div className={`d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3 ${styles.heading}`}>
      <h5 className="mb-0">{config.heading}{list && <span className="badge bg-primary ms-2">{list.totalRecords}</span>}</h5>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={exporting} onClick={exportRows}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
        {!deleted && <button className="btn btn-sm btn-danger" type="button" disabled={!selected.length} onClick={() => setAction("Delete Selected")}>
          <i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected
        </button>}
        <Link className="btn btn-primary" href={deleted ? config.activePath : config.deletedPath}>{deleted ? "Back" : config.deletedLabel}</Link>
      </div>
    </div>
    {exportError && <p role="alert" className="text-danger">{exportError}</p>}
    {deleted ? <div className="card mb-3"><div className="card-body">
      <CatalogDateFilter dates={emptyDates} apply={(dates) => setFilters(dates.startDate ? new URLSearchParams(dates).toString() : "")} />
    </div></div> : registrations && <RegistrationFilters apply={setFilters} />}
    <DashboardTable key={filters} title={title} hideHeading load={load} columns={columns}
      leadingColumn={deleted ? undefined : leadingColumn} />
    {action && <SubmissionConfirmation action={action} noun={config.noun} close={() => setAction(undefined)} />}
  </>;
}
