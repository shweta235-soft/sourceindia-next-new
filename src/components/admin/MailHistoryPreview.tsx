"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getMailHistory, mailLabel, renderMailTemplate } from "@/lib/adminMailHistory";
import { getAdminSubmissions } from "@/lib/adminSubmissions";
import { leadText, type LeadRecord } from "@/lib/adminEnquiries";
import styles from "./product-keywords.module.css";

export default function MailHistoryPreview({ row, deleted, batch, close }: {
  row: LeadRecord; deleted: boolean; batch?: boolean; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [result, setResult] = useState<{ person?: LeadRecord; subject?: string; html?: string; error?: string }>();

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function preview() {
      let person = row;
      if (batch) {
        const query = new URLSearchParams({ code: leadText(row.mail_code), limit: "1", sortBy: "id", sort: "ASC", deleted: String(deleted) });
        person = (await getMailHistory("detail", query, signal)).data[0] ?? {};
      }
      const id = leadText(person.email_id);
      if (!/^\d{1,12}$/.test(id)) throw new Error("No template is mapped to this email.");
      const query = new URLSearchParams({ kind: "emails", action: "detail", id });
      const template = await getAdminSubmissions<LeadRecord>(query, signal);
      const html = renderMailTemplate(leadText(template.message), leadText(person.user_name), leadText(person.user_email || person.mail),
        `${window.location.origin}/login`);
      if (!signal.aborted) setResult({ person, subject: leadText(template.subject || template.title), html });
    }
    void preview().catch((error: unknown) => {
      if (!signal.aborted) setResult({ error: error instanceof Error ? error.message : "Mail preview could not be loaded." });
    });
    return () => controller.abort();
  }, [row, deleted, batch]);

  const recipient = leadText(result?.person?.user_name);
  const email = leadText(result?.person?.user_email || result?.person?.mail);
  const previewDocument = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>body{margin:0;color:#212529;font:14px/1.65 system-ui,sans-serif}</style>${result?.html ?? ""}`;

  return <dialog ref={dialog} className={`modal show ${styles.dialog}`} aria-labelledby={title} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title visually-hidden" id={title}>Mail Preview</h5>
        <button type="button" aria-label="Close" className="btn-close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">
        <div className="border rounded-3 p-3 bg-light">
          <div className="mx-auto bg-white border rounded-4 shadow-sm overflow-hidden">
            <div className="border-bottom px-4 py-3">
              <h6 className="mb-1">{result?.subject || (batch ? mailLabel(leadText(row.mail_master_list)) : "Email template")}</h6>
              {(recipient || email) && <div className="small text-muted">To: {recipient || "-"}{email && ` (${email})`}</div>}
            </div>
            <div className="px-4 py-4">
              {!result ? <p role="status" className="text-center text-muted mb-0">Loading template preview...</p> :
                result.error ? <p role="alert" className="text-center text-danger mb-0">{result.error}</p> :
                  result.html ? <iframe title="Email template body" className="w-100 border-0" style={{ height: 280 }}
                    sandbox="" srcDoc={previewDocument} /> :
                    <p className="text-center text-muted mb-0">No template content found.</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => dialog.current?.close()}>Close</button></div>
    </div></div>
  </dialog>;
}
