"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getMenuSettings, type MenuItem, type MenuKind, type MenuList } from "@/lib/adminMenuSettings";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import dialogStyles from "./product-keywords.module.css";

type MenuDraft = Omit<MenuItem, "id">;
type Option = [value: number, label: string];

const initialMenu: MenuDraft = { name: "", link: "", type: 1, status: 1, is_show: 1, position: 1 };
const types: Option[] = [[1, "Header"], [2, "Footer"]];
const statuses: Option[] = [[1, "Active"], [0, "Inactive"]];
const visibility: Option[] = [[1, "Yes"], [0, "No"]];

function MenuDialog({ title, wide = false, close, children }: {
  title: string; wide?: boolean; close: () => void; children: (dismiss: () => void) => ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  const dismiss = () => dialog.current?.close();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${dialogStyles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className={`modal-dialog${wide ? " modal-xl modal-dialog-scrollable" : ""}`}><div className="modal-content">
      <div className="modal-header">
        <h5 id={titleID} className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={dismiss} />
      </div>
      {children(dismiss)}
    </div></div>
  </dialog>;
}

function MenuSelect({ label, value, options, change }: { label: string; value: number; options: Option[]; change: (value: number) => void }) {
  return <select className="form-select" aria-label={label} value={value} onChange={(event) => change(Number(event.target.value))}>
    {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
  </select>;
}

function Badge({ value, positive, negative }: { value: boolean; positive: string; negative: string }) {
  return <span className={`badge ${value ? "bg-success" : "bg-danger"}`}>{value ? positive : negative}</span>;
}

function MenuEditor({ draft, change, front, child, positions, adding, cancel }: {
  draft: MenuDraft; change: (draft: MenuDraft) => void; front: boolean; child: boolean;
  positions: number; adding?: boolean; cancel?: () => void;
}) {
  const prefix = adding ? "New menu" : "Edit menu";
  const positionOptions: Option[] = Array.from({ length: positions }, (_, index) => [index + 1, String(index + 1)]);
  if (!positionOptions.some(([value]) => value === draft.position)) positionOptions.push([draft.position, String(draft.position)]);
  return <>
    <td><input className="form-control" aria-label={`${prefix} name`} placeholder={adding && !child ? "Enter name" : undefined}
      value={draft.name} onChange={(event) => change({ ...draft, name: event.target.value })} /></td>
    <td><input className="form-control" aria-label={`${prefix} link`} placeholder={adding && !child ? "Enter link" : undefined}
      value={draft.link} onChange={(event) => change({ ...draft, link: event.target.value })} /></td>
    {front && <td>{child ? <Badge value={draft.type === 1} positive="Header" negative="Footer" /> :
      <MenuSelect label={`${prefix} type`} value={draft.type} options={types} change={(type) => change({ ...draft, type, position: 1 })} />}</td>}
    <td><MenuSelect label={`${prefix} status`} value={draft.status} options={statuses} change={(status) => change({ ...draft, status })} /></td>
    {front && <td><MenuSelect label={`${prefix} visibility`} value={draft.is_show} options={visibility}
      change={(is_show) => change({ ...draft, is_show })} /></td>}
    {front && !child && <td><MenuSelect label={`${prefix} position`} value={draft.position} options={positionOptions}
      change={(position) => change({ ...draft, position })} /></td>}
    <td>
      <button type="button" className={`btn btn-sm btn-success${adding ? "" : " me-2"}`} aria-label={`Save ${prefix.toLowerCase()}`} disabled>
        <i className={`bx bx-save${adding || child ? " pe-1" : ""}`} aria-hidden="true" />{adding || child ? "Save" : ""}
      </button>
      {cancel && <button type="button" className="btn btn-sm btn-secondary" aria-label="Cancel edit" onClick={cancel}>
        <i className="bx bx-x" aria-hidden="true" />
      </button>}
    </td>
  </>;
}

function MenuTable({ kind, parent, openChildren }: { kind: MenuKind; parent?: MenuItem; openChildren?: (item: MenuItem) => void }) {
  const front = kind === "front";
  const child = Boolean(parent);
  const parentID = parent?.id;
  const [result, setResult] = useState<{ data?: MenuList; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const [newRow, setNewRow] = useState<MenuDraft>({ ...initialMenu, type: parent?.type ?? 1 });
  const [editing, setEditing] = useState<MenuItem>();
  const [remove, setRemove] = useState<MenuItem>();

  useEffect(() => {
    const controller = new AbortController();
    void getMenuSettings(kind, parentID, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ error: error instanceof Error ? error.message : "Menu records could not be loaded." });
      }
    });
    return () => controller.abort();
  }, [kind, parentID, attempt]);

  function positionCount(type: number, adding: boolean) {
    if (!front || child) return 0;
    const count = (type === 1 ? result?.data?.headerCount : result?.data?.footerCount) ?? 0;
    return Math.min(2000, Math.max(1, count + Number(adding)));
  }

  const headers = [
    ["ID", 70], ["Name"], ["Link"],
    ...(front ? [["Type", 120]] : []),
    ["Status", 120],
    ...(front ? [["Show", 120]] : []),
    ...(front && !child ? [["Position", 120]] : []),
    ["Action", 150],
  ] as const;
  const rows = result?.data?.rows ?? [];

  return <>
    <div className="table-responsive">
      <table className={`table table-bordered${child ? "" : " align-middle"}`}>
        <thead className={child ? undefined : "table-light"}><tr>
          {headers.map(([name, width]) => <th scope="col" key={name} style={child || !width ? undefined : { width }}>{name}</th>)}
        </tr></thead>
        <tbody>
          <tr>
            <td>New</td>
            <MenuEditor draft={newRow} change={setNewRow} front={front} child={child} positions={positionCount(newRow.type, true)} adding />
          </tr>
          {rows.map((row, index) => <tr key={row.id}>
            <td>{index + 1}</td>
            {editing?.id === row.id ? <MenuEditor draft={editing} change={(draft) => setEditing({ ...draft, id: row.id })}
              front={front} child={child} positions={positionCount(editing.type, false)} cancel={() => setEditing(undefined)} /> : <>
              <td>{row.name}</td><td>{row.link}</td>
              {front && <td><Badge value={(parent?.type ?? row.type) === 1} positive="Header" negative="Footer" /></td>}
              <td><Badge value={row.status === 1} positive="Active" negative="Inactive" /></td>
              {front && <td><Badge value={row.is_show === 1} positive="Yes" negative="No" /></td>}
              {front && !child && <td>{row.position}</td>}
              <td>
                {openChildren && <button type="button" className="btn btn-sm btn-secondary me-2 mb-1"
                  aria-label={`Child menus for ${row.name}`} onClick={() => openChildren(row)}><i className="bx bx-plus" aria-hidden="true" /></button>}
                <button type="button" className={`btn btn-sm btn-primary me-2${front && !child ? " mb-1" : ""}`}
                  aria-label={`Edit ${row.name}`} onClick={() => setEditing({ ...row, type: parent?.type ?? row.type })}>
                  <i className="bx bx-edit" aria-hidden="true" />
                </button>
                <button type="button" className={`btn btn-sm btn-danger${front && !child ? " mb-1" : ""}`}
                  aria-label={`Delete ${row.name}`} onClick={() => setRemove(row)}><i className="bx bx-trash" aria-hidden="true" /></button>
              </td>
            </>}
          </tr>)}
          {!rows.length && <tr><td colSpan={headers.length} className="text-center">
            {!result ? <span role="status">Loading...</span> : result.error ? <span role="alert">{result.error} <button type="button"
              className="btn btn-link btn-sm" onClick={() => { setResult(undefined); setAttempt((value) => value + 1); }}>Retry</button></span> :
              child ? "No child menus. Add a new one above." : "No records found"}
          </td></tr>}
        </tbody>
      </table>
    </div>
    {remove && <MenuDialog title="Confirm Deletion" close={() => setRemove(undefined)}>{(dismiss) => <>
      <div className="modal-body">Are you sure you want to delete {remove.name || "this menu"}?</div>
      <div className="modal-footer justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={dismiss}>Cancel</button>
        <button type="button" className="btn btn-danger" disabled>Delete</button>
      </div>
    </>}</MenuDialog>}
  </>;
}

export default function AdminMenuSettings({ kind }: { kind: MenuKind }) {
  const [parent, setParent] = useState<MenuItem>();
  const heading = kind === "front" ? "Front Menu" : "Shortcut Menu";
  return <>
    <ReportsBreadcrumb page="Settings" title={kind === "front" ? "Front Menus" : "Shortcut Menus"} />
    <h5 className="mb-3">{heading}</h5>
    <div className="card"><div className="card-body">
      <MenuTable kind={kind} openChildren={kind === "front" ? setParent : undefined} />
    </div></div>
    {parent && <MenuDialog title="Child Menus" wide close={() => setParent(undefined)}>{() =>
      <div className="modal-body"><MenuTable kind="front" parent={parent} /></div>
    }</MenuDialog>}
  </>;
}
