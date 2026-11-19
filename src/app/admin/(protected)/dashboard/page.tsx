"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import DashboardSections from "@/components/admin/DashboardSections";
import styles from "@/components/admin/dashboard-sections.module.css";
import { downloadCategoryMaster } from "@/components/admin/exportCategoryMaster";

type Counts = Record<string, number | undefined>;
type Endpoint = { key: string; path: string };
const endpoints: Endpoint[] = [
  { key: "sellers", path: "sellers/count" }, { key: "buyers", path: "buyers/count" },
  { key: "categories", path: "categories/count" }, { key: "subCategories", path: "sub_categories/count" },
  { key: "itemCategories", path: "item_category/count" }, { key: "itemSubCategories", path: "item_sub_category/count" },
  { key: "items", path: "items/count" }, { key: "products", path: "products/count" },
  { key: "enquiries", path: "enquiries/count" },
];
type Stat = { label: string; source: string; field: string; href?: string; total?: boolean };
const statIcons = ["bx bxs-user-plus","bx bxs-user-plus","bx bxs-group","bx bxs-user-check","bx bxs-user-x","bx bxs-user-minus","bx bxs-user-x","bx bxs-group","bx bxs-user-check","bx bxs-user-x","bx bxs-user-minus","bx bxs-category","bx bx-list-ul","bx bx-list-ul","bx bx-list-ul","bx bx-list-ul","bx bxs-shopping-bag","bx bxs-group","bx bxs-shopping-bag","bx bx-search","bx bxs-shopping-bags"];
const stats: Stat[] = [
  {label:"Today Seller Members",source:"sellers",field:"addedToday"},
  {label:"Today Buyer Members",source:"buyers",field:"addedToday"},
  {label:"Total Seller Members",source:"sellers",field:"total",total:true,href:"/admin/sellers"},
  {label:"Active Seller Members",source:"sellers",field:"statusActive",href:"/admin/sellers"},
  {label:"Inactive Seller Members",source:"sellers",field:"statusInactive",href:"/admin/inactive_sellers"},
  {label:"Not Approved Seller Members",source:"sellers",field:"notApproved",href:"/admin/not_approved_sellers"},
  {label:"Not Complete Seller",source:"sellers",field:"notCompleted",href:"/admin/not_completed_sellers"},
  {label:"Total Buyer Members",source:"buyers",field:"total",total:true,href:"/admin/buyers"},
  {label:"Active Buyer Members",source:"buyers",field:"statusActive",href:"/admin/buyers"},
  {label:"Inactive Buyer Members",source:"buyers",field:"statusInactive",href:"/admin/inactive_buyers"},
  {label:"Not Approved Buyer Members",source:"buyers",field:"notApproved",href:"/admin/not_approved_buyers"},
  {label:"Total Category",source:"categories",field:"total",href:"/admin/product_categories"},
  {label:"Total Sub Category",source:"subCategories",field:"total",href:"/admin/product_sub_categories"},
  {label:"Item Category",source:"itemCategories",field:"total",href:"/admin/item_category"},
  {label:"Item Sub Category",source:"itemSubCategories",field:"total",href:"/admin/item_sub_category"},
  {label:"Items",source:"items",field:"total",href:"/admin/new_items"},
  {label:"Total Products",source:"products",field:"total",href:"/admin/products"},
  {label:"Total Public Products",source:"products",field:"statusPublic",href:"/admin/approve-product-list"},
  {label:"Total Draft Products",source:"products",field:"statusDraft",href:"/admin/notapprove-product-list"},
  {label:"Enquiries Generated",source:"enquiries",field:"total",href:"/admin/enquiries-list"},
  {label:"Product added this month",source:"products",field:"addedThisMonth"},
];
const scrollToMembers = (kind:"sellers"|"buyers") => {
  const section = document.getElementById(kind === "sellers" ? "today-register-seller" : "today-register-buyer");
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
};
const sellerTotalFields = ["statusActive","statusInactive","notApproved","notCompleted","deleted"];
const buyerTotalFields = ["statusActive","statusInactive","notApproved","deleted"];
function valueFor(stat: Stat, data: Record<string, Counts>) {
  const item = data[stat.source];
  if (!item) return undefined;
  if (stat.total) {
    const fields = stat.source === "sellers" ? sellerTotalFields : buyerTotalFields;
    return fields.reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
  }
  const value = item[stat.field];
  return value != null && Number.isFinite(Number(value)) ? Number(value) : undefined;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Record<string, Counts>>({});
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function exportMaster() {
    setExporting(true);
    setExportError("");
    try {
      const response = await apiFetch<unknown>("categories/master", { signal: AbortSignal.timeout(20000) });
      if (!Array.isArray(response)) throw new Error("Invalid Category Master response");
      downloadCategoryMaster(response);
    } catch {
      setExportError("Category Master could not be downloaded. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]);
    const requests = endpoints.map(({ key, path }) => apiFetch<Counts>(path, { signal })
      .then((counts) => {
        if (!counts || typeof counts !== "object" || Array.isArray(counts)) throw new Error("Invalid counts");
        if (!controller.signal.aborted) setData((previous) => ({ ...previous, [key]: counts }));
      }));
    void Promise.allSettled(requests).then((results) => {
      if (controller.signal.aborted) return;
      setFailed(results.some((result) => result.status === "rejected"));
      setLoading(false);
    });
    return () => controller.abort();
  }, [attempt]);

  return <div>
    <header className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
      <h1 className={`mb-1 ${styles.heading}`}>Dashboard</h1>
      <button type="button" className={`btn btn-sm mb-2 me-2 ${styles.primaryButton}`} disabled={exporting} onClick={() => void exportMaster()}>
        <i className="bx bx-download me-1" aria-hidden="true" />
        {exporting ? "Preparing Excel…" : "Download Category Master"}
      </button>
    </header>
    {exportError && <p className="alert alert-danger py-2" role="alert">{exportError}</p>}
    {failed && <div className="alert alert-warning py-2" role="status">
      Some dashboard counts could not be loaded.
      <button type="button" className="btn btn-link btn-sm" disabled={loading} onClick={() => {
        setFailed(false);
        setLoading(true);
        setAttempt((previous) => previous + 1);
      }}>Retry</button>
    </div>}
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4" aria-busy={loading}>
      {stats.map((stat, index) => {
        const tone = index % 4;
        const decoration = `/element-0${tone + 1}.svg`;
        const content = <div className={`card position-relative overflow-hidden h-100 ${styles.statCard}`}>
          <div className="card-body ps-4 py-4">
            <div className="d-flex align-items-center gap-2">
              <div className={styles.statLabel}>
                <p className="mb-2">{stat.label}</p>
                <span className={styles.statValue}>{valueFor(stat, data) ?? (loading ? "…" : "—")}</span>
              </div>
              <span className={`ms-auto ${styles.statIcon}`} data-tone={tone}><i className={statIcons[index]} aria-hidden="true" /></span>
            </div>
          </div>
          <Image src={decoration} width={23} height={44}
            className={`position-absolute top-0 start-0 ${styles.statDecoration}`} alt="" />
        </div>;
        return <div className="col mb-4" key={stat.label}>
          {stat.href ? <Link href={stat.href} className={styles.statLink}>{content}</Link> : index < 2 ?
            <button type="button" className={styles.statLink} onClick={() => scrollToMembers(index === 0 ? "sellers" : "buyers")}>{content}</button> : content}
        </div>;
      })}
    </div>
    <DashboardSections />
  </div>;
}
