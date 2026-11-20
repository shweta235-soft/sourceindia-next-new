"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { keepTrackedTicket, validTicketNumber, type TicketDetails } from "@/lib/publicSupport";

export default function TrackSupportTicket({ initialNumber = "", onTracked }: {
  initialNumber?: string; onTracked?: (ticket: TicketDetails) => void;
}) {
  const router = useRouter();
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const fields = new FormData(event.currentTarget);
    const number = String(fields.get("number") ?? "").trim();
    if (!validTicketNumber(number)) { setError("Enter a valid ticket number."); return; }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/support/track", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ number, email: fields.get("email") }),
      });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) { setError(body.message || "Ticket tracking could not be completed."); return; }
      const ticket = body as TicketDetails;
      if (!validTicketNumber(ticket.number)) { setError("Ticket details could not be loaded."); return; }
      keepTrackedTicket(ticket);
      if (onTracked && ticket.number.toUpperCase() === initialNumber.toUpperCase()) {
        onTracked(ticket);
      } else {
        router.push(`/ticket/view/${encodeURIComponent(ticket.number)}`);
      }
    } catch {
      if (!controller.signal.aborted) setError("Ticket tracking could not be completed. Please try again.");
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return <div className="knowledgeBox"><div className="card"><div className="card-body p-4 p-md-5">
    <div className="contact-form"><form onSubmit={submit}>
      <h2 className="h4 mb-4">Track Ticket</h2>
      <div className="row py-3 gy-2">
        <div className="col-md-4"><label htmlFor="track-email" className="form-label">Email<sup className="text-danger">*</sup></label>
          <input id="track-email" name="email" type="email" autoComplete="email" placeholder="Enter Email" className="form-control" maxLength={254} required /></div>
        <div className="col-md-4"><label htmlFor="track-number" className="form-label">Ticket Number<sup className="text-danger">*</sup></label>
          <input id="track-number" name="number" defaultValue={initialNumber} maxLength={80} placeholder="Enter Ticket Number" className="form-control" required /></div>
      </div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="mt-2 d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit Ticket"}</button>
        <Link href="/get-support" className="btn btn-secondary">Back</Link>
      </div>
    </form></div>
  </div></div></div>;
}
