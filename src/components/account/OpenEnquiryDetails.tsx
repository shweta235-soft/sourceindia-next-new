"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leadDate } from "@/lib/adminEnquiries";
import { readEnquiryDirectory } from "@/lib/accountEnquiryDirectory";

import OpenEnquiryThreads from "./OpenEnquiryThreads";

type Details = { title: string; description: string; created_at: string; owner: boolean; closed: boolean };

export default function OpenEnquiryDetails({ id, scope }: { id: number; scope: "all" | "mine" }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: Details; error?: string }>();
  const key = `${id}:${scope}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ view: "detail", scope, id: String(id) });
    void readEnquiryDirectory<Details>(query, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult({ key, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ key, error: error.message }); });
    return () => controller.abort();
  }, [id, scope, key]);

  const current = result?.key === key ? result : undefined;
  const enquiry = current?.data;
  return <>
    <Link href={scope === "all" ? "/open-enquiry-dashboard" : "/my-open-enquiry-dashboard"} className="btn btn-sm btn-primary mb-3">Back</Link>
    {!current && <p role="status">Loading enquiry…</p>}
    {current?.error && <p role="alert" className="alert alert-danger">{current.error}
      <button className="btn btn-link btn-sm" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
    </p>}
    {enquiry && <>
      <div className="card">
      <div className="card-body">
        <h1 className="h3 fw-bold">{enquiry.title}</h1>
        {enquiry.owner && <button type="button" className="btn btn-danger rounded-pill px-4 py-1 mt-1 btn-sm mb-2" disabled>
          {enquiry.closed ? "This Enquiry Closed" : "Close Enquiry"}
        </button>}
        <p className="text-break" style={{ whiteSpace: "pre-wrap" }}>{enquiry.description}</p>
        <p><i className="bx bx-time me-1" aria-hidden="true" />{leadDate(enquiry.created_at)}</p>
      </div>
      </div>
      <OpenEnquiryThreads key={key} id={id} scope={scope} />
    </>}
  </>;
}
