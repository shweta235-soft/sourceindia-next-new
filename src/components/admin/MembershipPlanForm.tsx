"use client";

import { useEffect, useId, useRef, useState } from "react";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { getAdminSubmissions } from "@/lib/adminSubmissions";
import modalStyles from "./product-keywords.module.css";

const textFields = [
  ["name", "Name", "text"],
  ["sub_title", "Sub Title", "text"],
  ["price", "Price", "number"],
  ["user", "No. of users", "number"],
  ["category", "No. of categories", "number"],
  ["product", "No. of products", "number"],
  ["expire_days", "Validity", "number"],
] as const;

const yesNo = [["1", "Yes"], ["0", "No"]];
const selectFields = [
  ["status", "Status", [["1", "Active"], ["0", "Inactive"]]],
  ["is_default", "Is default", yesNo],
  ["free", "Plan Type", [["1", "Free"], ["0", "Paid"]]],
  ["elcina_plan", "Elcina Plan", yesNo],
] as const;

export default function MembershipPlanForm({ row, close }: { row?: LeadRecord; close: () => void }) {
  const planID = leadText(row?.id);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  const [result, setResult] = useState<{ plan?: LeadRecord; error?: string }>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    if (!planID) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ kind: "membership_plan", action: "detail", id: planID });
    void getAdminSubmissions<LeadRecord>(query, controller.signal).then((plan) => {
      if (!controller.signal.aborted) setResult({ plan });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({
        error: error instanceof Error ? error.message : "Membership plan could not be loaded.",
      });
    });
    return () => controller.abort();
  }, [attempt, planID]);

  const plan = result?.plan ? { ...row, ...result.plan } : undefined;
  return <dialog ref={dialog} className={`add-update-form modal show ${modalStyles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">
      <div className="modal-header">
        <h5 id={titleID} className="modal-title">{planID ? "Edit Membership Plan" : "Add Membership Plan"}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body container">
        {planID && !result && <p role="status" className="mb-0">Loading membership plan…</p>}
        {result?.error && <p role="alert" className="mb-0">{result.error} <button type="button" className="btn btn-link btn-sm" onClick={() => {
          setResult(undefined);
          setAttempt((previous) => previous + 1);
        }}>Retry</button></p>}
        {(!planID || plan) && <form className="row" onSubmit={(event) => event.preventDefault()}>
          {textFields.map(([field, label, type]) => <div className="form-group col-md-6 mb-3" key={field}>
            <label className="form-label required" htmlFor={`plan-${field}`}>{label}</label>
            <input id={`plan-${field}`} className="form-control" type={type} step={field === "price" ? "any" : undefined} placeholder={label}
              defaultValue={leadText(plan?.[field])} required />
          </div>)}
          {selectFields.map(([field, label, options]) => <div className="form-group col-md-6 mb-3" key={field}>
            <label className="form-label required" htmlFor={`plan-${field}`}>{label}</label>
            <select id={`plan-${field}`} className="form-select" defaultValue={leadText(plan?.[field]) || (field === "status" ? "1" : "")} required>
              {field !== "status" && <option value="">Select here</option>}
              {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </div>)}
          <div className="modal-footer justify-content-between col-md-12">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Close</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled>{planID ? "Update" : "Save"}</button>
          </div>
        </form>}
      </div>
    </div></div>
  </dialog>;
}
