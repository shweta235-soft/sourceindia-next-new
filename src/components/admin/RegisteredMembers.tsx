"use client";

import Link from "next/link";
import { leadDate, leadText } from "@/lib/adminEnquiries";
import { getAdminMemberData, type Member, type MemberList } from "@/lib/adminMembers";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";

function Lines({ row, fields }: { row: Member; fields: string[] }) {
  return fields.map((field) => {
    const value = leadText(row[field]);
    return value && <div key={field}>{value}</div>;
  });
}

const dates: DashboardColumn[] = [
  { key: "created_at", label: "Created At", render: (row) => leadDate(row.created_at) },
  { key: "updated_at", label: "Updated At", render: (row) => leadDate(row.updated_at) },
];

const sellerColumns: DashboardColumn[] = [
  { key: "organization_name", label: "Company", render: (row) => {
    const name = leadText(row.organization_name);
    const slug = leadText(row.organization_slug);
    const membership = Number(row.elcina_member);
    return <>
      {name && <div><strong>{slug ? <Link href={`/companies/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">{name}</Link> : name}</strong></div>}
      {(membership === 1 || membership === 2) && <div><span className="badge bg-primary mb-1 text-uppercase">{membership === 1 ? "Elcina Member" : "Trial"}</span></div>}
      {Number(row.is_trading) === 1 && <div><span className="badge bg-success mb-1">Trader</span></div>}
      {[["full_name", "bx-user"], ["email", "bx-user"], ["mobile", "bx-mobile"], ["state_name", "bx-map"], ["city_name", "bx-map"]].map(([key, icon]) => {
        const value = leadText(row[key]);
        return value && <div key={key}><i className={`bx ${icon} me-1`} aria-hidden="true" />{value}</div>;
      })}
    </>;
  } },
  { key: "coreactivity_name", label: "Coreactivity / Category / Segment / Sub Segment", render: (row) => <Lines row={row} fields={["coreactivity_name", "activity_name", "category_name", "sub_category_name"]} /> },
  { key: "designation", label: "Designation / Website / Quality Certification", render: (row) => <Lines row={row} fields={["designation", "company_website", "organization_quality_certification"]} /> },
  ...dates,
];

const buyerColumns: DashboardColumn[] = [
  { key: "full_name", label: "Name", render: (row) => <>
    <Lines row={row} fields={["full_name", "email", "mobile"]} />
    {Number(row.walkin_buyer) === 1 && <span className="badge bg-primary">Walkin Buyer</span>}
  </> },
  { key: "country_name", label: "Location", render: (row) => <Lines row={row} fields={["country_name", "state_name", "city_name"]} /> },
  ...dates,
];

function loadSellers(query: URLSearchParams, signal: AbortSignal) {
  query.set("kind", "sellers");
  query.set("todayOnly", "true");
  return getAdminMemberData<MemberList>(query, signal);
}

function loadBuyers(query: URLSearchParams, signal: AbortSignal) {
  query.set("kind", "buyers");
  query.set("todayOnly", "true");
  return getAdminMemberData<MemberList>(query, signal);
}

export default function RegisteredMembers() {
  return <>
    <DashboardTable id="today-register-seller" title="Today Register Seller" columns={sellerColumns} load={loadSellers} />
    <DashboardTable id="today-register-buyer" title="Today Register Buyer" columns={buyerColumns} load={loadBuyers} />
  </>;
}
