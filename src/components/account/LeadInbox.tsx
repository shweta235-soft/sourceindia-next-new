"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { canReadLeadChat, readLeadInbox, type ChatThread, type InboxMessage } from "@/lib/accountLeadInbox";
import { leadDate } from "@/lib/adminEnquiries";
import { assetUrl } from "@/lib/asset";
import styles from "./lead-inbox.module.css";

function Company({ thread }: { thread: ChatThread }) {
  return <div className="d-flex align-items-center gap-2 text-start">
    <img src={assetUrl(thread.photo, "/user-demo.png")} width={40} height={40} alt="" className="img-thumbnail object-fit-cover"
      onError={(event) => { if (!event.currentTarget.src.endsWith("/user-demo.png")) event.currentTarget.src = "/user-demo.png"; }} />
    <div className="text-break">
      <div className="fw-bold">{thread.name || thread.number}</div>
      {thread.location && <small><i className="bx bx-map me-1" aria-hidden="true" />{thread.location}</small>}
    </div>
  </div>;
}

export function LeadConversation({ thread, direction, showLink = true }: { thread: ChatThread; direction: string; showLink?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; messages?: InboxMessage[]; error?: string }>();
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void readLeadInbox<InboxMessage[]>(new URLSearchParams({ view: "messages", direction, id: String(thread.id) }), controller.signal)
      .then((messages) => { if (!controller.signal.aborted) setResult({ attempt, messages }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ attempt, error: error.message }); });
    return () => controller.abort();
  }, [attempt, direction, thread.id]);

  const current = result?.attempt === attempt ? result : undefined;
  useEffect(() => {
    const content = scroll.current;
    if (content) content.scrollTop = content.scrollHeight;
  }, [current]);

  return <section className={styles.conversation} aria-label={`Conversation ${thread.number}`}>
    <header className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom pb-3">
      <Company thread={thread} />
      {showLink && <Link href={`/lead-detail/${encodeURIComponent(thread.number)}?${direction === "outgoing" ? "my-enquiry=true" : "received=1"}`}>
        {thread.number}
      </Link>}
    </header>
    <div className={styles.messages} ref={scroll}>
      {!current && <p role="status">Loading conversation…</p>}
      {current?.error && <p role="alert">{current.error}
        <button type="button" className="btn btn-link btn-sm" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
      </p>}
      {current?.messages?.length === 0 && <p className="text-secondary">No messages yet.</p>}
      {current?.messages?.map((message) => <div className={`d-flex mb-3 ${message.mine ? "justify-content-end" : ""}`} key={message.id}>
        <div className={styles.message}>
          <small className={`d-block text-secondary mb-1 ${message.mine ? "text-end" : ""}`}>
            {[message.name, leadDate(message.date)].filter(Boolean).join(" · ")}
          </small>
          <div className={`rounded py-2 px-3 ${message.mine ? styles.sent : styles.received}`}>{message.message}</div>
        </div>
      </div>)}
    </div>
    <div className="input-group mt-3">
      <span className="input-group-text" aria-hidden="true"><i className="bx bx-envelope" /></span>
      <input className="form-control" placeholder="Type a message" aria-label="Message" />
      <button className="btn btn-primary" type="button" disabled>Send</button>
    </div>
  </section>;
}

function Inbox({ outgoing }: { outgoing: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; threads?: ChatThread[]; error?: string }>();
  const [selected, setSelected] = useState<number>();
  const direction = outgoing ? "outgoing" : "incoming";
  const title = outgoing ? "Enquiry Chat" : "Leads Message";

  useEffect(() => {
    const controller = new AbortController();
    void readLeadInbox<ChatThread[]>(new URLSearchParams({ view: "chats", direction }), controller.signal)
      .then((threads) => { if (!controller.signal.aborted) setResult({ attempt, threads }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ attempt, error: error.message }); });
    return () => controller.abort();
  }, [attempt, direction]);

  const current = result?.attempt === attempt ? result : undefined;
  const threads = current?.threads;
  const active = threads?.find((item) => item.id === selected) ?? threads?.[0];
  return <>
    <nav aria-label="Breadcrumb" className="mb-3 small text-secondary"><Link href="/">Home</Link> / {title}</nav>
    <div className="card">
      {!current && <p role="status" className="p-4 mb-0">Loading conversations…</p>}
      {current?.error && <p role="alert" className="p-4 mb-0">{current.error}
        <button className="btn btn-link btn-sm" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
      </p>}
      {threads?.length === 0 && <div className="text-center p-5"><img src="/no-data.jpg" alt="No conversations" className="img-fluid w-50" /></div>}
      {threads && active && <div className={styles.inbox}>
        <section className={styles.sidebar} aria-label="Chat">
          <h1 className="h6 mb-0 border-bottom p-3">Chat</h1>
          <div className={styles.threads}>
            {threads.map((thread) => <button type="button" key={thread.id} aria-pressed={thread.id === active.id}
              className={styles.thread} onClick={() => setSelected(thread.id)}><Company thread={thread} /></button>)}
          </div>
        </section>
        <LeadConversation key={active.id} thread={active} direction={direction} />
      </div>}
    </div>
  </>;
}

export default function LeadInbox({ outgoing }: { outgoing: boolean }) {
  const { user } = useAuth();
  if (!user || !canReadLeadChat(user, outgoing)) return <p role="alert">Chats are unavailable for your account.</p>;
  return <Inbox key={`${user.id}:${outgoing}`} outgoing={outgoing} />;
}
