"use client";

import { useEffect, useRef, useState } from "react";
import { readEnquiryDirectory } from "@/lib/accountEnquiryDirectory";
import { leadDate } from "@/lib/adminEnquiries";

type Thread = { id: number; name: string; messages: { id: number; text: string; date: string; mine: boolean }[] };

export default function OpenEnquiryThreads({ id, scope }: { id: number; scope: "all" | "mine" }) {
  const [threads, setThreads] = useState<Thread[]>();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number>();
  const content = useRef<HTMLDivElement>(null);
  const thread = threads?.find((item) => item.id === selected) ?? threads?.[0];

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ view: "threads", scope, id: String(id) });
    void readEnquiryDirectory<Thread[]>(params, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setThreads(data); })
      .catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [id, scope]);

  useEffect(() => {
    const area = content.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [thread]);

  if (error) return <p role="alert" className="alert alert-danger">Conversations could not be loaded.</p>;
  if (!threads) return <p role="status">Loading conversations…</p>;
  if (!thread) return null;

  return <div className="row g-3 mt-1">
    {scope === "mine" && <div className="col-md-4">
      <section className="card h-100">
        <div className="card-header py-3"><h2 className="h5 fw-bold mb-0">Conversations</h2></div>
        <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "420px" }}>
          {threads.map((item) => <button type="button" key={item.id} aria-pressed={item.id === thread.id}
            className={`list-group-item list-group-item-action ${item.id === thread.id ? "active" : ""}`}
            onClick={() => setSelected(item.id)}>
            <span className="d-block fw-semibold">{item.name || "Conversation"}</span>
            <small className="d-block text-truncate">{item.messages.at(-1)?.text}</small>
          </button>)}
        </div>
      </section>
    </div>}
    <div className={scope === "mine" ? "col-md-8" : "col-12"}>
      <section className="card">
        <div className="card-header bg-light py-3"><h2 className="h6 mb-0">{thread.name || "Conversation"}</h2></div>
        <div className="card-body overflow-auto" ref={content} style={{ minHeight: "220px", maxHeight: "420px" }}>
          {thread.messages.map((message, index) => <div className={`d-flex mb-3 ${message.mine ? "justify-content-end" : ""}`} key={message.id || index}>
            <div className={`rounded py-2 px-3 text-break ${message.mine ? "bg-primary text-white" : "bg-light"}`}
              style={{ maxWidth: "85%", whiteSpace: "pre-wrap" }}>
              <small className="d-block">{leadDate(message.date)}</small>
              {message.text}
            </div>
          </div>)}
        </div>
        <div className="card-footer input-group">
          <input className="form-control" placeholder="Type a message" aria-label="Message" />
          <button type="button" className="btn btn-primary" disabled>Send</button>
        </div>
      </section>
    </div>
  </div>;
}
