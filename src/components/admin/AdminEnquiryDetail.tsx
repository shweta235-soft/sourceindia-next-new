"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/asset";
import { getAdminEnquiryData, leadDate, leadText, type LeadDetailResult, type LeadRecord, type OpenEnquiryDetailResult } from "@/lib/adminEnquiries";
import styles from "./catalog-master.module.css";
import enquiryStyles from "./enquiry-preview.module.css";

const leadPath = "/admin/admin-view-enquiry/";
const leadLists: Record<string, string> = {
  public: "/admin/public_enquiries", approved: "/admin/approve_leads",
  pending: "/admin/enquiries-list", leads: "/admin/leads", deleted: "/admin/enquiry-remove-list",
};

function Field({ label, value }: { label: string; value: string | number }) {
  return <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
    <span className="text-secondary">{label}</span><span>{value || "—"}</span>
  </div>;
}

type Message = { sender: string; content: string; date: string; right: boolean; avatar?: string };

function Messages({ messages }: { messages: Message[] | null }) {
  return <div className="card"><div className="card-body">
    <ul className="nav nav-pills mb-3"><li className="nav-item"><span className={`nav-link active ${enquiryStyles.messagesTab}`}>Messages</span></li></ul>
    <div className={enquiryStyles.chat}>
      {!messages && <p className="text-secondary">Messages could not be loaded.</p>}
      {messages?.length === 0 && <p className="text-secondary">No messages yet.</p>}
      {messages?.map(({ sender, content, date, right, avatar }, index) =>
        <div className={`d-flex gap-2 mb-3 ${right ? "justify-content-end" : ""}`} key={index}>
          {avatar && !right && <img src={avatar} alt="" width={40} height={40} className="rounded-circle border object-fit-cover" />}
          <div className={right ? "text-end" : ""}>
            <p className={`mb-0 ${enquiryStyles.chatTime}`}>{sender}{date ? `, ${date}` : ""}</p>
            <p className={`mb-0 ${enquiryStyles.bubble} ${right ? enquiryStyles.reply : ""}`}>{content}</p>
          </div>
          {avatar && right && <img src={avatar} alt="" width={40} height={40} className="rounded-circle border object-fit-cover" />}
        </div>)}
    </div>
  </div></div>;
}

function Heading({ back, open }: { back: string; open: boolean }) {
  return <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
    <nav className="page-breadcrumb mb-3" aria-label="breadcrumb"><ol className="breadcrumb mb-0">
      <li className="breadcrumb-item"><Link href="/admin/dashboard">Home</Link></li>
      <li className="breadcrumb-item"><Link href={back}>{open ? "Open Enquiries" : "Leads Master"}</Link></li>
      <li className="breadcrumb-item active" aria-current="page">{open ? "View Open Enquiry" : "View Enquiry"}</li>
    </ol></nav>
    <Link className="btn btn-primary mb-2" href={back}>Back</Link>
  </div>;
}

function OpenDetail({ id }: { id: string }) {
  const [state, setState] = useState<{ id: string; data?: OpenEnquiryDetailResult; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    getAdminEnquiryData<OpenEnquiryDetailResult>(new URLSearchParams({ action: "open-detail", id }), controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ id, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setState({ id, error: error.message }); });
    return () => controller.abort();
  }, [id]);

  const current = state?.id === id ? state : undefined;
  const back = "/admin/open_enquiries";
  if (!current?.data) return <div className={styles.master}>
    <Heading back={back} open />
    <p role="status">{current?.error || "Loading enquiry..."}</p>
  </div>;

  const { record: row, messages } = current.data;
  const name = [leadText(row.fname), leadText(row.lname)].filter(Boolean).join(" ") || leadText(row.name);
  const mappedMessages = messages?.map((message): Message => {
    const isSender = row.user_id != null && leadText(message.user_id) === leadText(row.user_id);
    const sender = [leadText(message.fname), leadText(message.lname)].filter(Boolean).join(" ");
    return { sender: sender || (isSender ? "User" : "Admin"), content: leadText(message.message),
      date: leadDate(message.created_at), right: !isSender };
  }) ?? null;

  return <div className={styles.master}>
    <Heading back={back} open />
    <div className="row gy-3">
      <div className="col-md-4"><div className="card"><div className="card-body">
        <h6 className="mb-3 fw-semibold">Contact Information</h6>
        <div className="border-bottom mb-3 pb-2">
          <Field label="Name" value={name} /><Field label="Email" value={leadText(row.email)} />
          <Field label="Mobile" value={leadText(row.mobile) || leadText(row.phone)} />
        </div>
        <h6 className="mb-3 fw-semibold">Open Enquiry Information</h6>
        <Field label="Date Created" value={leadDate(row.created_at)} />
        <Field label="Status" value={row.status ? leadText(row.status) : "Pending"} />
      </div></div></div>
      <div className="col-md-8">
        <div className="card mb-3"><div className="card-body">
          <h6 className="mb-3 fw-semibold">Enquiry Detail</h6>
          <p className="text-secondary mb-1">Title</p><h5 className="mb-3">{leadText(row.title)}</h5>
          <p className="text-secondary mb-1">Message</p><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{leadText(row.description)}</p>
        </div></div>
        <Messages messages={mappedMessages} />
      </div>
    </div>
  </div>;
}

function plainText(value: unknown) {
  return leadText(value).replace(/<br\s*\/?\s*>|<\/p\s*>/gi, "\n").replace(/<[^>]*>/g, "").trim();
}

function LeadDetail({ id, from }: { id: string; from?: string }) {
  const [state, setState] = useState<{ id: string; data?: LeadDetailResult; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    getAdminEnquiryData<LeadDetailResult>(new URLSearchParams({ action: "detail", number: id }), controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ id, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setState({ id, error: error.message }); });
    return () => controller.abort();
  }, [id]);

  const current = state?.id === id ? state : undefined;
  const back = from && Object.hasOwn(leadLists, from) ? leadLists[from] : leadLists.pending;
  if (!current?.data) return <div className={styles.master}>
    <Heading back={back} open={false} />
    <p role="status">{current?.error || "Loading enquiry..."}</p>
  </div>;

  const { record: row, messages, previous, next } = current.data;
  const product = row.product_details as LeadRecord;
  const name = leadText(row.from_full_name) || leadText(row.name);
  const email = leadText(row.from_email) || leadText(row.email);
  const mobile = leadText(row.from_mobile) || leadText(row.phone);
  const company = leadText(row.from_organization_name) || leadText(row.company);
  const pending = row.is_approve != null && Number(row.is_approve) === 0 && Number(row.is_delete) !== 1;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const detailHref = (number: string) => leadPath + encodeURIComponent(number) + (from ? `?from=${encodeURIComponent(from)}` : "");
  const mappedMessages = messages?.map((message): Message => {
    const right = row.user_id != null && leadText(message.user_id) === leadText(row.user_id);
    const sender = [leadText(message.user_fname), leadText(message.user_lname)].filter(Boolean).join(" ");
    return {
      sender: right ? "You" : sender || "User", right,
      date: leadDate(message.updated_at ?? message.created_at), content: leadText(message.message),
      avatar: assetUrl(leadText(right ? message.seller_file : message.user_file), "/user-demo.png"),
    };
  }) ?? null;

  return <div className={styles.master}>
    <Heading back={back} open={false} />
    <div className="card mb-3"><div className="card-body d-flex gap-3 flex-wrap justify-content-between align-items-center">
      <div className="d-flex gap-3 align-items-center">
        <div className={enquiryStyles.initials}>{initials || <i className="bx bx-user" aria-hidden="true" />}</div>
        <div>
          <h5 className="mb-0">{name || "Enquiry sender"}</h5>
          {email && <p className="mb-0"><i className="bx bx-envelope me-1" />{email}</p>}
          {mobile && <p className="mb-0"><i className="bx bx-phone me-1" />{mobile}</p>}
          {company && <p className="mb-0"><i className="bx bx-buildings me-1" />{company}</p>}
        </div>
      </div>
      {pending && <div className="d-flex gap-2 flex-wrap">
        <button type="button" className="btn btn-success" disabled>Approve</button>
        <button type="button" className="btn btn-danger" disabled>Delete</button>
        {previous && <Link className="btn btn-secondary" href={detailHref(previous)}><i className="bx bx-left-arrow-alt" />Previous</Link>}
        {next && <Link className="btn btn-secondary" href={detailHref(next)}>Next<i className="bx bx-right-arrow-alt" /></Link>}
      </div>}
    </div></div>
    <div className="row gy-3">
      <div className="col-md-4"><div className="card"><div className="card-body">
        <h6 className="mb-3 fw-semibold">Lead Information</h6>
        <div className="border-bottom mb-3 pb-2">
          <Field label="Date Created" value={leadDate(row.created_at)} /><Field label="Enquiry Number" value={leadText(row.enquiry_number)} />
        </div>
        <h6 className="mb-3 fw-semibold">Enquiry Detail</h6>
        <div className="border-bottom mb-3 pb-2">
          <Field label="Quantity" value={leadText(row.quantity)} />
          <Field label="Category" value={leadText(row.seller_category_names)} />
          <Field label="Sub Category" value={leadText(row.seller_subcategory_names)} />
          <p className="mb-2">{plainText(row.description)}</p>
        </div>
        <h6 className="mb-3 fw-semibold">Product Detail</h6>
        <Field label="Product Name" value={leadText(product?.title) || leadText(row.enquiry_product)} />
        <Field label="Category" value={leadText(product?.category)} /><Field label="Sub Category" value={leadText(product?.sub_category)} />
        <Field label="Company Name" value={leadText(product?.company)} />
        {product?.description ? <p className="mb-0">{plainText(product.description)}</p> : null}
      </div></div></div>
      <div className="col-md-8"><Messages messages={mappedMessages} /></div>
    </div>
  </div>;
}

export default function AdminEnquiryDetail({ id, open = false, from }: { id: string; open?: boolean; from?: string }) {
  return open ? <OpenDetail id={id} /> : <LeadDetail id={id} from={from} />;
}
