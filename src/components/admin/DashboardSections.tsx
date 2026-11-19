"use client";

import Link from "next/link";
import { getAdminEnquiryData, leadDate, leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import RegisteredMembers from "./RegisteredMembers";
import DashboardStockCharts from "./DashboardStockCharts";

function Contact({ row, side }: { row: LeadRecord; side: "from" | "to" }) {
  const company = leadText(row[`${side}_organization_name`]);
  const slug = leadText(row[`${side}_organization_slug`]);
  const kind = leadText(row[`${side}_user_type`]);
  return <>
    {company && <div>{slug ? <Link href={`/companies/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">{company}</Link> : company}</div>}
    {["full_name", "email", "mobile"].map((field) => {
      const value = leadText(row[`${side}_${field}`]);
      return value && <div key={field}>{value}</div>;
    })}
    {(kind === "0" || kind === "1") && <span className="badge bg-primary">{kind === "1" ? "Seller" : "Buyer"}</span>}
  </>;
}

const leadColumns: DashboardColumn[] = [
  { key: "enquiry_number", label: "Lead Number", render: (row) => {
    const number = leadText(row.enquiry_number);
    return number && <Link href={`/admin/admin-view-enquiry/${encodeURIComponent(number)}`}>{number}</Link>;
  } },
  { key: "from_organization_name", label: "Sender", render: (row) => <Contact row={row} side="from" /> },
  { key: "to_organization_name", label: "Receiver", render: (row) => <Contact row={row} side="to" /> },
  { key: "enquiry_product", label: "Product", render: (row) => {
    const product = leadText(row.product_name) || leadText(row.enquiry_product);
    const slug = leadText(row.product_slug);
    return slug ? <Link href={`/products/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">{product}</Link> : product;
  } },
  { key: "quantity", label: "Quantity", render: (row) => leadText(row.quantity) },
  { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
  { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
];

function loadLeads(query: URLSearchParams, signal: AbortSignal) {
  query.set("view", "dashboard");
  return getAdminEnquiryData<LeadListResult>(query, signal);
}

export default function DashboardSections() {
  return <>
    <DashboardStockCharts />
    <DashboardTable title="Leads" columns={leadColumns} load={loadLeads} />
    <RegisteredMembers />
  </>;
}
