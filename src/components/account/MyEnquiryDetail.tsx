"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { enquiryCode, readAccountEnquiries } from "@/lib/accountEnquiries";
import { leadDate, type LeadRecord } from "@/lib/adminEnquiries";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";
import { EnquiryStatus } from "./MyEnquiries";

function details(values: [string, ReactNode][]) {
  return <dl className="mb-3 pb-2 border-bottom">
    {values.map(([name, value]) => <div className="d-flex justify-content-between gap-2 mb-2" key={name}>
      <dt className="fw-normal text-secondary">{name}</dt><dd className="text-end mb-0 text-break">{value || "—"}</dd>
    </div>)}
  </dl>;
}

function directoryLink(type: "companies" | "products", name: string, slug: string) {
  return name && enquiryCode(slug) ? <Link href={`/${type}/${encodeURIComponent(slug)}`}>{name}</Link> : name;
}

export default function MyEnquiryDetail({ number }: { number: string }) {
  const { user } = useAuth();
  const requestKey = `${user?.id ?? ""}:${number}`;
  const [result, setResult] = useState<{ key: string; row?: LeadRecord; error?: string }>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void readAccountEnquiries<LeadRecord>(new URLSearchParams({ view: "detail", number }), controller.signal)
      .then((row) => { if (!controller.signal.aborted) setResult({ key: requestKey, row }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message }); });
    return () => controller.abort();
  }, [requestKey, number, attempt]);

  const current = result?.key === requestKey ? result : undefined;
  const row = current?.row;
  const product = record(row?.product);
  const messages = Array.isArray(row?.messages) ? row.messages.map(record) : null;
  const status = text(row?.status) === "3" ? "3" : text(record(row?.item).enquiry_status);

  return <>
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div className="small text-secondary"><Link href="/">Home</Link> / Settings / View Enquiry</div>
      <Link href="/my_enquiry" className="btn btn-primary btn-sm">Back</Link>
    </div>
    {!current && <p role="status">Loading enquiry…</p>}
    {current?.error && <div className="alert alert-danger" role="alert">{current.error}
      <button type="button" className="btn btn-link btn-sm" onClick={() => { setResult(undefined); setAttempt((n) => n + 1); }}>Retry</button>
    </div>}
    {row && <>
      <div className="card mb-3"><div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <span className="rounded-circle bg-warning-subtle text-warning-emphasis border border-warning p-3" aria-hidden="true">
            {text(row.to_full_name).split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0].toUpperCase()).join("") || <i className="bx bx-user" />}
          </span>
          <div>
            <h1 className="h5 mb-1">{text(row.to_full_name) || "View Enquiry"}</h1>
            {Boolean(row.to_email) && <p className="mb-0"><i className="bx bx-envelope me-1" aria-hidden="true" />{text(row.to_email)}</p>}
            {Boolean(row.to_mobile) && <p className="mb-0"><i className="bx bx-phone me-1" aria-hidden="true" />{text(row.to_mobile)}</p>}
            {Boolean(row.to_organization_name) && <p className="mb-0"><i className="bx bx-buildings me-1" aria-hidden="true" />{text(row.to_organization_name)}</p>}
          </div>
        </div>
        <EnquiryStatus status={status} />
      </div></div>
      <div className="row">
        <div className="col-md-4"><div className="card mb-3"><div className="card-body">
          <h2 className="h6 mb-3">Lead Information</h2>
          {details([["Date Created", leadDate(row.created_at)], ["Quantity", text(row.quantity)], ["Enquiry Number", <b>{text(row.enquiry_number)}</b>]])}
          <h2 className="h6 mb-3">Company Detail</h2>
          {details([["Company Name", directoryLink("companies", text(row.to_organization_name), text(row.to_organization_slug))],
            ["Core Activity", text(row.to_core_activity_name)], ["Activity", text(row.to_activity_name)]])}
          <h2 className="h6 mb-3">Product Detail</h2>
          {details([["Product Name", directoryLink("products", text(product.title) || text(record(row.item).product_name), text(product.slug))],
            ["Category", text(product.category) || text(row.category_name)], ["Sub Category", text(product.subcategory) || text(row.sub_category_name)],
            ["Company Name", text(product.company)]])}
        </div></div></div>
        <div className="col-md-8"><div className="card mb-3"><div className="card-body">
          <div className="border-bottom pb-2 mb-3"><h2 className="h6 d-inline-block bg-primary text-white rounded px-3 py-2 mb-0">Messages</h2></div>
          {!messages ? <p className="text-secondary">Messages could not be loaded.</p> :
            !messages.length ? <div className="text-center p-4"><img src="/no-data.jpg" alt="" className="img-fluid w-50 mb-2" /><p>No enquiry messages.</p></div> :
            <div className="overflow-auto" style={{ maxHeight: 450 }}>
              {messages.map((message, index) => <div key={text(message.id) || index} className={`mb-3 ${message.mine ? "text-end" : ""}`}>
                <small className="text-secondary">{message.mine ? "You" : [text(message.user_fname), text(message.user_lname)].filter(Boolean).join(" ")} {leadDate(message.updated_at)}</small>
                <div><p className={`d-inline-block text-start rounded-3 py-2 px-3 mb-0 text-break ${message.mine ? "bg-primary-subtle" : "bg-light"}`}
                  style={{ whiteSpace: "pre-wrap", maxWidth: "90%" }}>{text(message.message)}</p></div>
              </div>)}
            </div>}
        </div></div></div>
      </div>
    </>}
  </>;
}
