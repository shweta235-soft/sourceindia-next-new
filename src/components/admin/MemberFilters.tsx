"use client";

import { useEffect, useId, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { apiFetch } from "@/lib/api";
import type { MemberKind } from "@/lib/adminMembers";
import { leadText } from "@/lib/adminEnquiries";
import styles from "./member-list.module.css";

type Filters = Record<string, string>;
type Option = { id: string; name: string };
const sourcing = [{ id: "yes", name: "Yes" }, { id: "no", name: "No" }];
const elcina = [{ id: "1", name: "Yes" }, { id: "2", name: "No" }, { id: "3", name: "Not Sure" }];

function FilterSelect({ label, value, onChange, path, options = [], placeholder = "All", useName = false, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; path?: string;
  options?: Option[]; placeholder?: string; useName?: boolean; disabled?: boolean;
}) {
  const id = useId();
  const [lookup, setLookup] = useState<{ path: string; options: Option[] }>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    apiFetch<{ data?: unknown[] } | unknown[]>(path, { signal: controller.signal }).then((response) => {
      const rows = Array.isArray(response) ? response : response.data ?? [];
      const list = rows.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const record = row as Record<string, unknown>;
        const name = leadText(record.name);
        const id = leadText(record.id) || name;
        return id && name ? [{ id, name }] : [];
      });
      setLookup({ path, options: list });
    }).catch(() => {});
    return () => controller.abort();
  }, [path]);
  const entries = path ? (lookup?.path === path ? lookup.options : []) : options;
  return <div className="col-md-3 mb-3">
    <label className="form-label" htmlFor={id}>{label}</label>
    <select id={id} className="form-select" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="">{placeholder}</option>
      {entries.map(({ id, name }) => <option key={id} value={useName ? name : id}>{name}</option>)}
    </select>
  </div>;
}

export default function MemberFilters({ kind, deleted, onApply }: {
  kind: MemberKind; deleted: boolean; onApply: (filters: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>({});
  const [showPicker, setShowPicker] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPicker) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !picker.current?.contains(event.target)) setShowPicker(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [showPicker]);
  const [month] = useState(() => new Date());
  const selection = {
    key: "selection",
    startDate: draft.startDate ? parseISO(draft.startDate) : month,
    endDate: draft.endDate ? parseISO(draft.endDate) : month,
  };
  const dateFilter = <div className={deleted ? "col-md-8 d-flex align-items-center gap-2" : "col-md-6 mb-3"}>
    <label className="form-label" htmlFor="member-date-range">Date Filter:</label>
    <div className="position-relative" ref={picker}>
      <button id="member-date-range" type="button" className="form-control text-start" aria-expanded={showPicker} onClick={() => setShowPicker(!showPicker)}>
        <i className="bx bx-calendar me-2" aria-hidden="true" />
        <span suppressHydrationWarning>{`${format(selection.startDate, "MMMM dd, yyyy")} - ${format(selection.endDate, "MMMM dd, yyyy")}`}</span>
      </button>
      {showPicker && <div className={`position-absolute z-3 bg-white shadow p-3 rounded ${styles.calendar}`} onKeyDown={(event) => { if (event.key === "Escape") setShowPicker(false); }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Select Date Range</h6>
          <button type="button" className="btn-close" aria-label="Close date picker" onClick={() => setShowPicker(false)} />
        </div>
        <DateRangePicker ranges={[selection]} showSelectionPreview editableDateInputs moveRangeOnFirstSelection={false} onChange={({ selection: range }) => {
          if (!range?.startDate || !range.endDate) return;
          const startDate = format(range.startDate, "yyyy-MM-dd");
          const endDate = format(range.endDate, "yyyy-MM-dd");
          setDraft((previous) => ({ ...previous, startDate, endDate }));
        }} />
        <div className="text-end mt-2"><button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowPicker(false)}>Close</button></div>
      </div>}
    </div>
  </div>;
  const update = (key: string, value: string) => {
    setDraft((previous) => ({
      ...previous, [key]: value,
      ...(key === "core_activity" ? { activity: "" } : {}),
      ...(key === "country" ? { state: "", city: "" } : {}),
      ...(key === "state" ? { city: "" } : {}),
    }));
  };
  const field = (key: string, label: string) => <label className="col-md-3 mb-3">
    <span className="form-label d-block">{label}</span>
    <input className="form-control" type="text" placeholder={`Enter ${label}`} value={draft[key] ?? ""} onChange={(event) => update(key, event.target.value)} />
  </label>;
  const select = (key: string, label: string, props: Pick<Parameters<typeof FilterSelect>[0], "path" | "options" | "placeholder" | "disabled" | "useName">) =>
    <FilterSelect label={label} value={draft[key] ?? ""} onChange={(value) => update(key, value)} {...props} />;
  const buyers = kind === "buyers";
  const stateCountry = buyers ? draft.country : "101";
  const dependentPath = (prefix: string, value: string | undefined) => value ? `${prefix}/${encodeURIComponent(value)}` : undefined;

  return <form className="card mb-3" onSubmit={(event) => { event.preventDefault(); setShowPicker(false); onApply(draft); }}>
    <div className="card-body"><div className="row">
      {buyers && dateFilter}
      {!deleted && <>
        {field("customerId", "Customer ID")}
        {buyers ? <>
          {field("full_name", "Full Name")}
          {select("sourcing_interest", "Sourcing Interest", { options: sourcing })}
          {select("country", "Country", { path: "location/countries" })}
        </> : <>
          {field("firstName", "First Name")}
          {field("lastName", "Last Name")}
          {field("organizationName", "Company")}
          {select("core_activity", "Core Activities", { path: "core_activities?is_delete=0" })}
          {select("activity", "Activities", { path: dependentPath("activities/coreactivity", draft.core_activity), disabled: !draft.core_activity })}
          {select("categoryId", "Categories", { path: "categories" })}
          {select("nature_business", "Nature of Business", { path: "sellers/nature_business" })}
        </>}
        {select("state", "State", { path: dependentPath("location/states", stateCountry), disabled: !stateCountry })}
        {select("city", "City", { path: dependentPath("location/cities", draft.state), disabled: !draft.state })}
        {!buyers && <>
          {select("designation", "Designations", { path: "sellers/designations", useName: true })}
          {select("elcina_member", "Elcina Member", { options: elcina, placeholder: "-- Select --" })}
        </>}
      </>}
      {!buyers && dateFilter}
      <div className={`${deleted ? "col-md-4" : "col-md-12"} d-flex justify-content-end gap-2`}>
        <button type="submit" className="btn btn-primary">Apply</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setDraft({}); setShowPicker(false); onApply({}); }}>Clear</button>
      </div>
    </div></div>
  </form>;
}
