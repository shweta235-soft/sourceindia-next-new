"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth, type User } from "@/context/AuthContext";
import { accountFlag, accountRead, accountRecord, displayText } from "@/lib/userDashboard";
import { assetUrl } from "@/lib/asset";
import { leadDate, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";
import AdminRowActions from "../admin/AdminRowActions";
import modalStyles from "../admin/product-keywords.module.css";
import styles from "./account.module.css";

const steps = [["Email Verify", "bx-envelope"], ["Profile", "bx-user"], ["Company", "bx-buildings"], ["Product", "bx-cart"]];

function SellerProgress({ user }: { user: User }) {
  let complete = 1;
  if (accountFlag(user.is_profile)) {
    complete = 2;
    if (accountFlag(user.is_company)) complete = accountFlag(user.is_product) ? 4 : 3;
  }

  return <div className="card mb-4"><div className="card-body">
    <div className={styles.progress} aria-label="Seller profile progress">
      <div className={styles.progressLine} aria-hidden="true"><span style={{ width: `${(complete - 1) * 100 / 3}%` }} /></div>
      <ol className={styles.steps}>
        {steps.map(([title, icon], index) => <li key={title} className={index < complete ? styles.completed : undefined}>
          <i className={`bx ${icon}`} aria-hidden="true" /><span>{title}</span>
          {index < complete && <span className={styles.stepCheck} aria-label="Completed">✓</span>}
        </li>)}
      </ol>
    </div>
  </div></div>;
}

function Recommendations({ sellers, items }: { sellers?: boolean; items: LeadRecord[] }) {
  const list = useRef<HTMLDivElement>(null);
  const title = sellers ? "Suggested Sellers" : "Suggested Products";
  if (!items.length) return null;
  function slide(direction: number) {
    const card = list.current?.firstElementChild;
    if (card) list.current?.scrollBy({ left: direction * (card.getBoundingClientRect().width + 20), behavior: "smooth" });
  }
  return <section className="my-5" aria-label={title}>
    <div className="firstHead text-center pb-3"><h1>{title}</h1></div>
    <div className={styles.carousel}>
      <div ref={list} className={`${styles.slides} ${sellers ? styles.companySlides : ""}`}>
        {items.map((item, index) => {
          const name = displayText(sellers ? item.organization_name : item.title);
          const slug = displayText(sellers ? item.organization_slug : item.slug);
          const path = slug && slug !== "." && slug !== ".." ? `/${sellers ? "companies" : "products"}/${encodeURIComponent(slug)}` : "";
          const image = displayText(accountRecord(sellers ? item.companyLogo : item.file).file);
          const location = [displayText(item.city_name), displayText(item.state_name)].filter(Boolean).join(", ");
          return <article className={styles.slide} key={displayText(item.id) || `${slug}-${index}`}>
            <img src={assetUrl(image, "/default.png")} alt="" loading="lazy" onError={(event) => {
              if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png";
            }} />
            <p className={styles.slideTitle} title={name}>{name}</p>
            {sellers && location && <p className="small text-muted mb-2"><i className="bx bx-map" aria-hidden="true" /> {location}</p>}
            {path && <Link href={path} className={`btn btn-sm ${sellers ? "btn-outline-primary" : "btn-primary"}`}
              aria-label={`View ${name}`}>View <i className="bx bx-right-arrow-alt" aria-hidden="true" /></Link>}
          </article>;
        })}
      </div>
      {items.length > 1 && <div className={styles.carouselControls}>
        <button type="button" className="btn btn-light" aria-label={`Previous ${title.toLowerCase()}`} onClick={() => slide(-1)}>
          <i className="bx bx-chevron-left" aria-hidden="true" /></button>
        <button type="button" className="btn btn-light" aria-label={`Next ${title.toLowerCase()}`} onClick={() => slide(1)}>
          <i className="bx bx-chevron-right" aria-hidden="true" /></button>
      </div>}
    </div>
  </section>;
}

function DeletePreview({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={title} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header"><h5 className="modal-title" id={title}>Confirm Deletion</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} /></div>
      <div className="modal-body">Are you sure you want to delete this enquiry?</div>
      <div className="modal-footer justify-content-between">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className="btn btn-danger" disabled>Delete</button>
      </div>
    </div></div>
  </dialog>;
}

function BuyerEnquiries({ id }: { id: string }) {
  const [preview, setPreview] = useState(false);
  const load = useCallback(async (query: URLSearchParams, signal: AbortSignal) => {
    query.set("user_id", id);
    const result = await accountRead<LeadListResult>(`enquiries/by-enquiry?${query}`, signal);
    if (!Array.isArray(result.data) || !Number.isFinite(result.filteredRecords) || !Number.isFinite(result.totalRecords)) {
      throw new Error("Your enquiries could not be loaded.");
    }
    return result;
  }, [id]);
  const firstItem = (row: LeadRecord) => accountRecord(Array.isArray(row.enquiry_users) ? row.enquiry_users[0] : null);
  const columns: DashboardColumn[] = [
    { key: "enquiry_number", label: "Enquiry No", render: (row) => displayText(row.enquiry_number) },
    { key: "name", label: "Receiver", sortable: false, render: (row) => {
      const receiver = accountRecord(row.from_user);
      return <>{displayText(receiver.full_name)}<br />{displayText(receiver.email)}</>;
    } },
    { key: "enquiry_product", label: "Product", render: (row) => displayText(firstItem(row).product_name) },
    { key: "quantity", label: "Quantity", render: (row) => displayText(row.quantity) },
    { key: "created_at", label: "Created", render: (row) => leadDate(row.created_at) },
    { key: "status", label: "Status", sortable: false, render: (row) => {
      const status = displayText(firstItem(row).enquiry_status);
      if (status === "1") return <span className="badge bg-success">Open</span>;
      if (status === "2" || status === "3") return <span className="badge bg-danger">Closed</span>;
      return <span className="badge bg-warning-subtle text-warning-emphasis">Pending</span>;
    } },
    { key: "action", label: "Action", sortable: false, render: (row) =>
      <AdminRowActions name={displayText(row.enquiry_number) || "enquiry"} actions={[
        { label: "Delete", icon: "bx-trash", danger: true, onClick: () => setPreview(true) },
      ]} /> },
  ];
  return <div className="mt-4">
    <DashboardTable title="My Enquiries" hideHeading columns={columns} load={load} initialSortDirection="ASC" />
    {preview && <DeletePreview close={() => setPreview(false)} />}
  </div>;
}

type Overview = { id: string; count?: string; countFailed?: boolean; message?: string; products?: LeadRecord[]; companies?: LeadRecord[] };

export default function UserDashboard() {
  const { user } = useAuth();
  const id = displayText(user?.id);
  const seller = accountFlag(user?.is_seller);
  const [overview, setOverview] = useState<Overview>();

  useEffect(() => {
    if (!/^\d+$/.test(id)) return;
    const controller = new AbortController();
    const { signal } = controller;
    function apply(value: Omit<Overview, "id">) {
      if (!signal.aborted) setOverview((previous) => ({ ...(previous?.id === id ? previous : {}), ...value, id }));
    }

    void accountRead<{ totalOpenEnquiries?: number }>(`open_enquiries/count/${id}`, signal)
      .then((data) => apply({ count: displayText(data.totalOpenEnquiries ?? 0) }))
      .catch(() => apply({ countFailed: true }));
    if (seller) {
      void accountRead<{ data?: { message?: string } }>(`sellers/seller-message/${id}`, signal)
        .then((data) => apply({ message: displayText(data.data?.message).replace(/<[^>]*>/g, " ").trim() }))
        .catch(() => {});
    }
    for (const [key, path] of [["products", "get-products"], ["companies", "get-seller-company"]] as const) {
      void accountRead<{ data?: LeadRecord[] }>(`dashboard/${path}?userId=${id}`, signal)
        .then(({ data }) => { if (Array.isArray(data)) apply({ [key]: data }); })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [id, seller]);

  const current = overview?.id === id ? overview : undefined;
  if (!user || !/^\d+$/.test(id)) return <p role="alert">Your account details could not be loaded.</p>;
  return <>
    <h1 className="visually-hidden">{seller ? "Seller Dashboard" : "Buyer Dashboard"}</h1>
    {seller && <SellerProgress user={user} />}
    {current?.message && <div className="card mb-4 border border-danger">
      <div className="card-body text-center">
        <i className="bx bx-message-dots text-danger display-6" aria-hidden="true" />
        <h4 className="card-title text-danger">Your profile has been declined reason.</h4>
        <p className="card-text">{current.message}</p>
      </div>
    </div>}
    <div className="row"><div className="col-md-4 col-sm-6">
      <div className="card rounded-3 border-start border-0 border-3 border-danger">
        <div className="card-body d-flex align-items-center gap-2">
          <div><p className="mb-0 text-secondary">Total My Open Enquiry (created)</p>
            <h4 className="my-1" aria-live="polite">{current?.count ?? "—"}</h4>
            {current?.countFailed && <span className="small text-danger">Count could not be loaded.</span>}
          </div>
          <span className={`${styles.countIcon} rounded-circle text-white ms-auto`}><i className="bx bxs-group" aria-hidden="true" /></span>
        </div>
      </div>
    </div></div>
    {!seller && <BuyerEnquiries key={id} id={id} />}
    <Recommendations items={current?.products ?? []} />
    <Recommendations sellers items={current?.companies ?? []} />
  </>;
}
