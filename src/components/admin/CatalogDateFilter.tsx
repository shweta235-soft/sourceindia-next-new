"use client";

import { useId, useState } from "react";
import { format, parseISO } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import styles from "./catalog-master.module.css";

type Dates = { startDate: string; endDate: string };
const emptyDates: Dates = { startDate: "", endDate: "" };

export default function CatalogDateFilter({ dates, apply }: { dates: Dates; apply: (dates: Dates) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(dates);
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date());
  const startDate = draft.startDate ? parseISO(draft.startDate) : today;
  const endDate = draft.endDate ? parseISO(draft.endDate) : today;

  return <div className="d-flex align-items-center flex-wrap gap-2">
    <label className="form-label mb-0" htmlFor={id}>Date Filter:</label>
    <div className="position-relative">
      <button className="form-control text-start" id={id} type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i className="bx bx-calendar me-2" aria-hidden="true" />
        <span suppressHydrationWarning>{format(startDate, "MMMM dd, yyyy")} - {format(endDate, "MMMM dd, yyyy")}</span>
      </button>
      {open && <div className={`position-absolute z-3 bg-white shadow p-3 rounded ${styles.datePopover}`}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <h6 className="mb-0">Select Date Range</h6>
          <button type="button" className="btn-close" aria-label="Close date picker" onClick={() => setOpen(false)} />
        </div>
        <DateRangePicker ranges={[{ key: "selection", startDate, endDate }]} showSelectionPreview moveRangeOnFirstSelection={false} editableDateInputs
          onChange={({ selection }) => {
            if (!selection?.startDate || !selection.endDate) return;
            setDraft({ startDate: format(selection.startDate, "yyyy-MM-dd"), endDate: format(selection.endDate, "yyyy-MM-dd") });
          }} />
      </div>}
    </div>
    <button className="btn btn-primary" type="button" onClick={() => {
      setOpen(false);
      apply({ startDate: format(startDate, "yyyy-MM-dd"), endDate: format(endDate, "yyyy-MM-dd") });
    }}>Apply</button>
    <button className="btn btn-secondary" type="button" onClick={() => {
      setOpen(false);
      setDraft(emptyDates);
      apply(emptyDates);
    }}>Clear</button>
  </div>;
}
