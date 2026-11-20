"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { assetUrl } from "@/lib/asset";
import { getTrackedTicket, type TicketDetails } from "@/lib/publicSupport";
import LegalDescriptionEditor from "../admin/LegalDescriptionEditor";
import SupportPortal from "./SupportPortal";
import TrackSupportTicket from "./TrackSupportTicket";

function date(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : "";
}

function replyText(value: string) {
  const template = document.createElement("template");
  template.innerHTML = value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(?:p|div|li|h[1-6])>/gi, "$&\n");
  template.content.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
  return template.content.textContent?.trim() ?? "";
}

function Reply({ entry }: { entry: TicketDetails["replies"][number] }) {
  const [message, setMessage] = useState("");
  useEffect(() => { setMessage(replyText(entry.message)); }, [entry.message]);
  const attachment = entry.attachment ? assetUrl(`upload/tickets/${encodeURIComponent(entry.attachment)}`, "") : "";
  return <div className="card mb-4">
    <div className="card-body d-flex flex-wrap justify-content-between align-items-start gap-4">
      <div className="flex-grow-1 text-break">
        <div className="mb-1 text-secondary">
          <p>{entry.name} {entry.sender && <strong className="badge bg-primary me-2 py-1 small">{entry.sender}</strong>}</p>
          {entry.date && <p>replied on {date(entry.date)}</p>}
        </div>
        <div className="mb-2" style={{ whiteSpace: "pre-wrap" }}>{message}</div>
      </div>
      {attachment && (/\.(jpe?g|png)$/i.test(entry.attachment)
        ? <a href={attachment} target="_blank" rel="noopener noreferrer" className="d-inline-block border p-2 rounded-1 shadow-sm">
          <img src={attachment} alt="Attachment" className="img-fluid" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ maxWidth: 150, maxHeight: 100 }} />
          <p className="mt-2 mb-0"><small>{entry.attachment}</small></p>
        </a>
        : <a href={attachment} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark">
          <i className="bx bx-file pe-1" aria-hidden="true" />View Attachment
        </a>)}
    </div>
  </div>;
}

function Ticket({ ticket }: { ticket: TicketDetails }) {
  const fields: [string, ReactNode][] = [
    ["Date Created", date(ticket.created)], ["Ticket ID #", ticket.number], ["Title", ticket.title],
    ["Category", <span className="badge bg-info">{ticket.category || "N/A"}</span>],
    ["Email", ticket.email], ["Name", ticket.name], ["Phone", ticket.phone],
    ["Last Reply", date(ticket.replies[0]?.date) || "No replies yet"],
  ];

  return <SupportPortal title={ticket.id ? `${ticket.title} - ${ticket.id}` : ticket.title} subtitle={ticket.number}>
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card"><div className="card-body">
          <h2 className="h5 headinginfo">Ticket Information</h2>
          <dl className="border-bottom mb-3 pb-3 mt-3">
            {fields.map(([label, value]) => <div className="d-flex justify-content-between align-items-start gap-2 mb-2" key={label}>
              <dt className="fw-normal text-secondary">{label}</dt><dd className="mb-0 text-end text-break">{value || "—"}</dd>
            </div>)}
          </dl>
          {ticket.previous.length > 0 && <>
            <h3 className="h5">My Previous Tickets</h3>
            <ul className="mb-3">
              {ticket.previous.map((item) => <li key={item.number}>
                <Link href={`/ticket/view/${encodeURIComponent(item.number)}`}>{item.number}</Link>
              </li>)}
            </ul>
          </>}
          <Link href="/get-support/trackticket" className="btn btn-secondary btn-sm">Back</Link>
        </div></div>
      </div>
      <div className="col-lg-8">
        <div className="card mb-4"><div className="card-body">
          <h2 className="h5 headinginfo mb-3">Add Reply</h2>
          <form onSubmit={(event) => event.preventDefault()}>
            <LegalDescriptionEditor description="" label="Message" />
            <input aria-label="Reply attachment" type="file" className="form-control my-3" />
            <button type="submit" className="btn btn-primary" disabled>Post</button>
          </form>
        </div></div>
        <h2 className="h5 headinginfo text-dark mb-3">Conversation</h2>
        <div className="conversationSection">
          {ticket.replies.length ? ticket.replies.map((entry, i) => <Reply key={entry.id || i} entry={entry} />)
            : <p className="text-muted">No replies yet.</p>}
        </div>
      </div>
    </div>
  </SupportPortal>;
}

export default function SupportTicketDetails({ number }: { number: string }) {
  const [ticket, setTicket] = useState<TicketDetails>();
  useEffect(() => { setTicket(getTrackedTicket(number)); }, [number]);
  return ticket && ticket.number.toUpperCase() === number.toUpperCase() ? <Ticket ticket={ticket} />
    : <SupportPortal><TrackSupportTicket initialNumber={number} onTracked={setTicket} /></SupportPortal>;
}
