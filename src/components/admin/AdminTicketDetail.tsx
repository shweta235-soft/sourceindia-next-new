"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leadDate, leadText } from "@/lib/adminEnquiries";
import { getSupportData, type TicketDetail } from "@/lib/adminSupport";
import { assetUrl } from "@/lib/asset";
import LegalDescriptionEditor from "./LegalDescriptionEditor";
import SupportDialog, { type SupportAction } from "./SupportDialog";

function TicketAttachment({ file }: { file: string }) {
  if (!file || /[/\\]/.test(file) || !/\.(pdf|jpe?g|png|gif|webp)$/i.test(file)) return null;
  const href = assetUrl(`upload/tickets/${encodeURIComponent(file)}`, "");
  if (!href) return null;
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file);
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className={isImage ? "d-inline-block border p-2 rounded-1 shadow-sm" : "btn btn-outline-dark text-nowrap"}>
    {isImage ? <>
      <img src={href} alt="Attachment" loading="lazy" decoding="async" style={{ maxWidth: 150, maxHeight: 100 }} />
      <p className="mt-2 mb-0"><small>{file}</small></p>
    </> : <><i className="bx bx-file pe-1" aria-hidden="true" />View Attachment</>}
  </a>;
}

export default function AdminTicketDetail({ ticketId }: { ticketId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data?: TicketDetail; error?: string }>();
  const [action, setAction] = useState<SupportAction>();
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ id: ticketId });
    void getSupportData<TicketDetail>("detail", params, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ error: error instanceof Error ? error.message : "Ticket could not be loaded." });
    });
    return () => controller.abort();
  }, [ticketId, attempt]);

  const ticket = state?.data?.ticket;
  return <>
    <nav className="mb-3" aria-label="Breadcrumb">
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
        <li className="breadcrumb-item"><Link href="/admin/tickets">Tickets</Link></li>
        {ticket && <li className="breadcrumb-item active" aria-current="page">{leadText(ticket.ticket_id)}</li>}
      </ol>
    </nav>
    {!state && <p role="status">Loading ticket…</p>}
    {state?.error && <p role="alert">{state.error} <button className="btn btn-link btn-sm" type="button"
      onClick={() => { setState(undefined); setAttempt((value) => value + 1); }}>Retry</button></p>}
    {state?.data && ticket && (() => {
      const { replies, lastReply } = state.data;
      const name = [leadText(ticket.fname), leadText(ticket.lname)].filter(Boolean).join(" ");
      const details = [
        ["Date Created", leadDate(ticket.created_at)], ["Ticket ID #", leadText(ticket.ticket_id)], ["Title", leadText(ticket.title)],
        ["Category", <span className="badge bg-info" key="category">{leadText(ticket.category_name) || "N/A"}</span>],
        ["Email", leadText(ticket.email)], ["Name", name], ["Phone", leadText(ticket.phone)],
        ["Last Reply", leadDate(lastReply.created_at) || "No replies yet"],
      ] as const;
      return <div className="row">
        <div className="col-lg-4">
          <div className="card"><div className="card-body">
            <h5>Ticket Information</h5>
            <dl className="border-bottom mb-3 pb-3 mt-3">
              {details.map(([label, value]) => <div className="d-flex justify-content-between align-items-center gap-2 mb-2" key={label}>
                <dt className="text-secondary fw-normal">{label}</dt><dd className="mb-0 text-dark text-end text-break">{value}</dd>
              </div>)}
            </dl>
            {["0", "1"].includes(leadText(ticket.status)) && <div className="border-bottom pb-3 mb-3">
              <h5>Issue Resolved/Cancel</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-primary" type="button" onClick={() => setAction("Resolve")}>Resolve</button>
                <button className="btn btn-danger" type="button" onClick={() => setAction("Cancel")}>Cancel</button>
              </div>
            </div>}
          </div></div>
        </div>
        <div className="col-lg-8">
          <div className="card mb-4"><div className="card-body">
            <h5 className="mb-3">Add Reply</h5>
            <form onSubmit={(event) => event.preventDefault()}>
              <div className="mb-3"><LegalDescriptionEditor description="" label="Reply message" /></div>
              <div className="mb-3"><input className="form-control" type="file" aria-label="Reply attachment" /></div>
              <button className="btn btn-primary" type="submit" disabled>Post</button>
            </form>
          </div></div>
          <h5 className="text-dark mb-3">Conversation</h5>
          {replies.length ? replies.map((reply, index) => <article className="card mb-4" key={leadText(reply.id) || index}>
            <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-4">
              <div className="text-break">
                <p className="text-secondary">{name} <strong className="badge bg-primary me-2 py-1 small">{leadText(reply.sender_type) || leadText(reply.added_by)}</strong></p>
                <p className="text-secondary">replied on {leadDate(reply.createdAt || reply.created_at)}</p>
                <div className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                  {leadText(reply.description || reply.reply).replace(/<br\s*\/?\s*>|<\/p\s*>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim()}
                </div>
              </div>
              <TicketAttachment file={leadText(reply.attachment)} />
            </div>
          </article>) : <p className="text-muted">No replies yet.</p>}
        </div>
      </div>;
    })()}
    {action && <SupportDialog action={action} close={() => setAction(undefined)} />}
  </>;
}
