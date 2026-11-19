"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import { getAdminSubmissions } from "@/lib/adminSubmissions";
import LegalDescriptionEditor from "./LegalDescriptionEditor";
import ReportsBreadcrumb from "./ReportsBreadcrumb";

const emailAudiences = ["Buyer", "Seller", "Admin", "Walkin Buyer"];

export default function AdminEmailForm({ emailID }: { emailID?: string }) {
  const [result, setResult] = useState<{ row?: LeadRecord; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const title = emailID ? "Edit Email" : "Add Email";

  useEffect(() => {
    if (!emailID) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ kind: "emails", action: "detail", id: emailID });
    void getAdminSubmissions<LeadRecord>(params, controller.signal).then((row) => {
      if (!controller.signal.aborted) setResult({ row });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ error: error instanceof Error ? error.message : "Email template could not be loaded." });
      }
    });
    return () => controller.abort();
  }, [emailID, attempt]);

  const row = result?.row;
  const audience = leadText(row?.email_for);
  return <>
    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
      <ReportsBreadcrumb page="Emails" title={title} />
      <Link href="/admin/emails-list" className="btn btn-primary btn-sm mb-3">Back</Link>
    </div>
    <div className="row"><div className="col-xl-12 mx-auto">
      <div className="card"><div className="card-body p-4">
        {emailID && !result && <p role="status" className="mb-0">Loading email template…</p>}
        {result?.error && <p role="alert" className="mb-0">{result.error} <button type="button" className="btn btn-link btn-sm" onClick={() => {
          setResult(undefined);
          setAttempt((previous) => previous + 1);
        }}>Retry</button></p>}
        {(!emailID || row) && <form className="row g-3" onSubmit={(event) => event.preventDefault()}>
          <div className="col-md-12">
            <label htmlFor="title" className="form-label required">Title</label>
            <input id="title" type="text" className="form-control" placeholder="Title"
              defaultValue={leadText(row?.title)} disabled={Boolean(emailID)} required />
          </div>
          <div className="col-md-6">
            <label htmlFor="email_for" className="form-label required">Email for</label>
            <select id="email_for" className="form-control" defaultValue={audience || "Buyer"} required>
              {audience && !emailAudiences.includes(audience) && <option value={audience}>{audience}</option>}
              {emailAudiences.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="subject" className="form-label required">Subject</label>
            <input id="subject" type="text" className="form-control" placeholder="Subject" defaultValue={leadText(row?.subject)} required />
          </div>
          {([["status", "Status"], ["is_seller_direct", "Is Seller Direct"]] as const).map(([field, label]) => (
            <div className="col-md-6" key={field}>
              <label htmlFor={field} className="form-label required">{label}</label>
              <select id={field} className="form-control" defaultValue={leadText(row?.[field])} required>
                {field === "status" && <option value="">Select here</option>}
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </div>
          ))}
          <div className="col-md-12">
            <label htmlFor="description" className="form-label required">Description</label>
            <textarea id="description" className="form-control" placeholder="Description" rows={3}
              defaultValue={leadText(row?.description)} required />
          </div>
          <div className="col-md-12"><LegalDescriptionEditor description={leadText(row?.message)} label="Message" showSource /></div>
          <div className="col-12">
            <button className="btn btn-primary btn-sm px-5" type="submit" disabled>{emailID ? "Update Email" : "Save Email"}</button>
          </div>
        </form>}
      </div></div>
    </div></div>
  </>;
}
