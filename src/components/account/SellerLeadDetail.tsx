"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { enquiryCode } from "@/lib/accountEnquiries";
import { useAuth } from "@/context/AuthContext";
import { canReadLeadChat, readLeadInbox } from "@/lib/accountLeadInbox";
import { leadDate, type LeadRecord } from "@/lib/adminEnquiries";
import { accountRecord as record, displayText as text } from "@/lib/userDashboard";
import { EnquiryStatus } from "./MyEnquiries";
import { LeadConversation } from "./LeadInbox";

function Info({ title, fields }: { title: string; fields: [string, ReactNode][] }) {
  return <>
    <h2 className="h6 mb-3 fw-semibold">{title}</h2>
    <dl className="border-bottom mb-3 pb-2">
      {fields.map(([label, value]) => <div key={label} className="d-flex justify-content-between gap-2 mb-2">
        <dt className="text-secondary fw-normal">{label}</dt><dd className="mb-0 text-end text-break">{value || "—"}</dd>
      </div>)}
    </dl>
  </>;
}

export default function SellerLeadDetail({ number }: { number: string }) {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const key = `${number}:${attempt}`;
  const [result, setResult] = useState<{ key: string; row?: LeadRecord; error?: string }>();

  useEffect(() => {
    const controller = new AbortController();
    void readLeadInbox<LeadRecord>(new URLSearchParams({ view: "detail", number }), controller.signal)
      .then((row) => { if (!controller.signal.aborted) setResult({ key, row }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ key, error: error.message }); });
    return () => controller.abort();
  }, [key, number]);

  const current = result?.key === key ? result : undefined;
  const row = current?.row;
  const item = record(row?.item);
  const product = record(row?.product);
  const companySlug = text(row?.from_organization_slug);
  const productSlug = text(product.slug);
  const name = text(row?.from_full_name);
  const company = text(row?.from_organization_name);
  const companyLink = enquiryCode(companySlug) ? <Link href={`/companies/${encodeURIComponent(companySlug)}`}>{company}</Link> : company;
  const productName = text(product.title) || text(item.product_name);
  const productLink = enquiryCode(productSlug) ? <Link href={`/products/${encodeURIComponent(productSlug)}`}>{productName}</Link> : productName;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return <>
    <div className="d-flex align-items-center justify-content-between mb-3">
      <nav aria-label="Breadcrumb" className="small text-secondary"><Link href="/">Home</Link> / Settings / View Enquiry</nav>
      <Link href="/seller_enquiry" className="btn btn-primary btn-sm">Back</Link>
    </div>
    {!current && <p role="status">Loading lead…</p>}
    {current?.error && <p role="alert" className="alert alert-danger">{current.error}
      <button className="btn btn-link btn-sm" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p>}
    {row && <>
      <div className="card mb-3"><div className="card-body d-flex align-items-center flex-wrap gap-3">
        {initials && <span className="rounded-circle border border-warning text-warning bg-warning-subtle p-3" aria-hidden="true">{initials}</span>}
        <div className="text-break">
          <h1 className="h5 mb-1">{name || company || number}</h1>
          {row.from_email ? <div><i className="bx bx-envelope me-1" aria-hidden="true" />{text(row.from_email)}</div> : null}
          {row.from_mobile ? <div><i className="bx bx-phone me-1" aria-hidden="true" />{text(row.from_mobile)}</div> : null}
          {company && <div><i className="bx bx-buildings me-1" aria-hidden="true" />{companyLink}</div>}
        </div>
        <div className="ms-auto"><EnquiryStatus status={text(item.enquiry_status)} /></div>
      </div></div>
      <div className="row g-3">
        <div className="col-md-4">
          <section className="card"><div className="card-body">
            <Info title="Lead Information" fields={[["Date Created", leadDate(row.created_at)], ["Quantity", text(row.quantity)], ["Enquiry Number", number]]} />
            <Info title="Company Detail" fields={[["Company Name", companyLink], ["Core Activity", text(row.from_core_activity_name)], ["Activity", text(row.from_activity_name)]]} />
            <Info title="Product Detail" fields={[["Product Name", productLink], ["Category", text(product.category)], ["Sub Category", text(product.subcategory)], ["Company Name", text(product.company)]]} />
            {row.description ? <><h2 className="h6">Description</h2>
              <p className="text-break mb-0" style={{ whiteSpace: "pre-wrap" }}>{text(row.description)}</p></> : null}
          </div></section>
        </div>
        {user && canReadLeadChat(user, false) && <div className="col-md-8">
          <div className="card">
            <LeadConversation key={number} direction="incoming" showLink={false}
              thread={{ id: Number(row.id), number, name: company || name, photo: "", location: "" }} />
          </div>
        </div>}
      </div>
    </>}
  </>;
}
