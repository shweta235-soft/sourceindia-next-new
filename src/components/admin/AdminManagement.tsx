"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Select from "react-select";
import { leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { managementLists, readManagementData, type ManagementList, type ManagementOption } from "@/lib/adminManagement";
import AdminRowActions from "./AdminRowActions";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./admin-management.module.css";
import modalStyles from "./product-keywords.module.css";

const logColumns: DashboardColumn[] = [
  { key: "source_module", label: "Source Module", render: (row) => leadText(row.source_module) },
  { key: "conflict_module", label: "Conflict Module", render: (row) => leadText(row.conflict_module) },
  { key: "conflict_flow", label: "Flow", render: (row) => leadText(row.conflict_flow) },
  { key: "conflict_name", label: "Name", render: (row) => leadText(row.conflict_name) },
  { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
];

type Confirmation = { kind: "selected" | "delete" } | { kind: "status"; active: boolean };
const blankForm = { id: "", name: "", email: "", mobile: "", password: "", option: "", optionName: "", status: "1" };

function ManagementConfirmation({ action, singular, plural, close }: {
  action: Confirmation; singular: string; plural: string; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  const status = action.kind === "status";
  const bulk = action.kind === "selected";
  const title = status ? "Confirm Status Change" : bulk ? "Confirm Bulk Deletion" : "Confirm Deletion";
  const message = status
    ? `Are you sure you want to ${action.active ? "deactivate" : "activate"} this ${singular}?`
    : `Are you sure you want to delete ${bulk ? `the selected ${plural}` : `this ${singular}`}?`;

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={titleId} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id={titleId}>{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">{message}</div>
      <div className="modal-footer justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className={`btn ${status ? "btn-warning" : "btn-danger"}`} disabled>
          {status ? "Yes, Change" : bulk ? "Delete Selected" : "Delete"}
        </button>
      </div>
    </div></div>
  </dialog>;
}

export default function AdminManagement({ kind }: { kind: ManagementList }) {
  const config = managementLists[kind];
  const logs = kind === "category_conflict_logs";
  const subAdmin = kind === "sub_admin";
  const singular = subAdmin ? "Sub Admin" : "Role";
  const plural = subAdmin ? "Sub Admins" : "Roles";
  const optionKey = subAdmin ? "role" : "ticket_category";
  const optionNameKey = subAdmin ? "role_name" : "category_name";
  const optionLabel = subAdmin ? "Role" : "Ticket Category";
  const [result, setResult] = useState<LeadListResult>();
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState(blankForm);
  const [lookup, setLookup] = useState<{ options: ManagementOption[]; error?: string }>();
  const [action, setAction] = useState<Confirmation>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const formName = useRef<HTMLInputElement>(null);
  const selectId = useId();

  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    setSelected([]);
    setResult(undefined);
    const response = await readManagementData<LeadListResult>(kind, "list", query, signal);
    if (!signal.aborted) setResult(response);
    return response;
  }, [kind]);

  useEffect(() => {
    if (logs) return;
    const controller = new AbortController();
    void readManagementData<ManagementOption[]>(kind, "options", undefined, controller.signal).then((options) => {
      if (!controller.signal.aborted) setLookup({ options });
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setLookup({ options: [], error: error.message });
    });
    return () => controller.abort();
  }, [kind, logs]);

  function edit(row: LeadRecord) {
    setForm({
      id: leadText(row.id), name: leadText(row.name), email: leadText(row.email), mobile: leadText(row.mobile),
      password: "", option: leadText(row[optionKey]), optionName: leadText(row[optionNameKey]), status: leadText(row.status),
    });
    formName.current?.focus();
  }

  const rows = result?.data ?? [];
  const rowIds = rows.map((row) => leadText(row.id)).filter(Boolean);
  const selection: DashboardColumn = {
    key: "select",
    label: <input type="checkbox" aria-label="Select all rows on this page" disabled={!rowIds.length}
      checked={rowIds.length > 0 && rowIds.every((id) => selected.includes(id))}
      onChange={(event) => setSelected(event.target.checked ? rowIds : [])} />,
    sortable: false,
    render: (row) => {
      const id = leadText(row.id);
      return <input type="checkbox" aria-label={`Select ${leadText(row.name)}`} checked={selected.includes(id)} disabled={!id}
        onChange={(event) => {
          const checked = event.target.checked;
          setSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id));
        }} />;
    },
  };

  const columns: DashboardColumn[] = [
    { key: "name", label: "Name", render: (row) => <>
      {leadText(row.name)}{subAdmin && <><br />{leadText(row.email)}<br />{leadText(row.mobile)}</>}
    </> },
    { key: optionNameKey, label: optionLabel, render: (row) => leadText(row[optionNameKey]) },
    { key: "status", label: "Status", sortable: false, render: (row) => {
      const active = leadText(row.status) === "1";
      return <div className="form-check form-switch">
        <input className="form-check-input" type="checkbox" role="switch" checked={active} readOnly
          aria-label={`Status for ${leadText(row.name)}`}
          onClick={(event) => { event.preventDefault(); setAction({ kind: "status", active }); }} />
      </div>;
    } },
    { key: "action", label: "Action", sortable: false, render: (row) =>
      <AdminRowActions name={leadText(row.name)} actions={[
        { label: "Edit", icon: "bx-edit", onClick: () => edit(row) },
        { label: "Delete", icon: "bx-trash", danger: true, onClick: () => setAction({ kind: "delete" }) },
      ]} /> },
  ];

  async function exportRows() {
    setExporting(true);
    setExportError("");
    try {
      const data = await readManagementData<LeadRecord[]>(kind, "export");
      const fields: [string, string][] = [["Name", "name"]];
      if (subAdmin) fields.push(["Email", "email"], ["Phone", "mobile"], ["Address", "address"]);
      fields.push(["Status", "getStatus"], ["Created", "created_at"], ["Last Update", "updated_at"]);
      downloadAdminWorkbook(data.map((row) => ({
        ...row, getStatus: leadText(row.getStatus) || (leadText(row.status) === "1" ? "Active" : "Inactive"),
        created_at: leadDate(row.created_at), updated_at: leadDate(row.updated_at),
      })), fields, subAdmin ? "User Export.xlsx" : "Roles Export.xlsx");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be loaded.");
    } finally {
      setExporting(false);
    }
  }

  const inputs: { key: "name" | "mobile" | "email" | "password"; label: string; type: string }[] = [
    { key: "name", label: "Name", type: "text" },
  ];
  if (subAdmin) {
    inputs.push({ key: "mobile", label: "Mobile", type: "tel" }, { key: "email", label: "Email", type: "email" });
    if (!form.id) inputs.push({ key: "password", label: "Password", type: "password" });
  }
  const options = lookup?.options ?? [];
  const currentOption = options.find((option) => option.id === form.option) ??
    (form.option ? { id: form.option, name: form.optionName || form.option } : null);

  return <>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
      <div>
        <h4 className={`mb-1 d-flex align-items-center ${styles.heading}`}>
          {config.heading}
          {!!result?.totalRecords && <span className={`badge ms-2 ${styles.count}`}>{result.totalRecords}</span>}
        </h4>
        <div className="page-breadcrumb d-none d-sm-flex align-items-start mb-3">
          <div className="breadcrumb-title">
            <Link href="/admin">Home</Link><i className="bx bx-chevron-right px-1" aria-hidden="true" />
          </div>
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb mb-0 p-0">
              <li className="breadcrumb-item">{config.section}</li>
              <li className="breadcrumb-item active" aria-current="page">{config.title}</li>
            </ol>
          </nav>
        </div>
      </div>
      {!logs && <div className="ms-auto">
        <button type="button" className="btn btn-sm btn-primary mb-2 me-2" onClick={exportRows} disabled={exporting}>
          <i className="bx bx-download me-1" aria-hidden="true" />{exporting ? "Exporting…" : "Excel"}
        </button>
        <button type="button" className="btn btn-sm btn-danger mb-2 me-2" disabled={!selected.length}
          onClick={() => setAction({ kind: "selected" })}><i className="bx bx-trash me-1" aria-hidden="true" />Delete Selected</button>
        <button type="button" className="btn btn-primary mb-2 me-2" onClick={() => { setForm(blankForm); formName.current?.focus(); }}>
          <i className="bx bxs-plus-square me-1" aria-hidden="true" />Add {config.title}
        </button>
      </div>}
    </div>
    {exportError && <p className="alert alert-danger" role="alert">{exportError}</p>}
    {logs ? <DashboardTable title={config.title} hideHeading columns={logColumns} load={load} /> :
      <div className="row">
        <div className="col-md-4">
          <div className="card"><div className="card-body">
            <h5 className="card-title mb-3">{form.id ? "Edit" : "Add"} {singular}</h5>
            <form className="row" onSubmit={(event) => event.preventDefault()}>
              {inputs.map(({ key, label, type }) => <label key={key} className="col-12 mb-3">
                <span className={`form-label d-block ${styles.required}`}>{label}</span>
                <input ref={key === "name" ? formName : undefined} className="form-control" type={type}
                  autoComplete={key === "password" ? "new-password" : "off"} placeholder={label} required value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              </label>)}
              <div className="col-12 mb-3">
                <label className={`form-label${subAdmin ? ` ${styles.required}` : ""}`} htmlFor={selectId}>{optionLabel}</label>
                <Select<ManagementOption> inputId={selectId} instanceId={selectId} isClearable isLoading={!lookup} options={options}
                  value={currentOption} onChange={(option) => setForm({ ...form, option: option?.id ?? "", optionName: option?.name ?? "" })}
                  getOptionLabel={(option) => option.name} getOptionValue={(option) => option.id}
                  placeholder={subAdmin ? "Select Role" : "Select Category"} styles={{ menu: (base) => ({ ...base, zIndex: 3 }) }} />
                {lookup?.error && <div className="text-danger small mt-1" role="alert">{lookup.error}</div>}
              </div>
              <label className="col-12 mb-3">
                <span className={`form-label d-block ${styles.required}`}>Status</span>
                <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="1">Active</option><option value="0">Inactive</option>
                </select>
              </label>
              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(blankForm)}>{form.id ? "Cancel" : "Reset"}</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled>{form.id ? "Update" : "Save"}</button>
              </div>
            </form>
          </div></div>
        </div>
        <div className="col-md-8">
          <DashboardTable title={config.title} hideHeading columns={columns} leadingColumn={selection} load={load} />
        </div>
      </div>}
    {action && <ManagementConfirmation action={action} singular={singular} plural={plural} close={() => setAction(undefined)} />}
  </>;
}
