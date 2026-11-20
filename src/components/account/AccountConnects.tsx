"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { canReadConnects, readEnquiryDirectory } from "@/lib/accountEnquiryDirectory";
import { enquiryCode } from "@/lib/accountEnquiries";
import { accountFlag, displayText as text } from "@/lib/userDashboard";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";

type Connect = {
  id: number; title: string; message: string; company_name: string; company_slug: string; created_at: string; direction: string;
};

const columns: DashboardColumn[] = [
  { key: "title", label: "Title", render: (row) => text(row.title) },
  { key: "message", label: "Message", render: (row) => <div className="text-break">{text(row.message)}</div> },
  { key: "company_name", label: "Company Name", render: (row) => {
    const slug = text(row.company_slug);
    const company = text(row.company_name) || "—";
    const sent = row.direction === "send";
    return <>{enquiryCode(slug) ? <Link href={`/companies/${encodeURIComponent(slug)}`}>{company}</Link> : company}<br />
      <span className={`badge mt-1 ${sent ? "bg-success" : "bg-primary"}`}>{sent ? "Send" : "Received"}</span></>;
  } },
  { key: "created_at", label: "Date", render: (row) => {
    const date = new Date(text(row.created_at));
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "";
  } },
];

export default function AccountConnects() {
  const { user } = useAuth();
  const allowed = Boolean(user && canReadConnects(user));
  const userId = text(user?.id);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${userId}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: Connect[]; error?: string }>();
  const [direction, setDirection] = useState("all");

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    void readEnquiryDirectory<{ data: Connect[] }>(new URLSearchParams({ view: "connects" }), controller.signal)
      .then(({ data }) => { if (!controller.signal.aborted) setResult({ key: requestKey, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message }); });
    return () => controller.abort();
  }, [allowed, requestKey]);

  const current = result?.key === requestKey ? result : undefined;
  const rows = current?.data;
  const load = useCallback(async (query: URLSearchParams) => {
    const term = (query.get("search") ?? "").toLocaleLowerCase();
    const scoped = (rows ?? []).filter((row) => direction === "all" || row.direction === direction);
    const matching = scoped.filter(({ title, message }) => [title, message].some((value) => value.toLocaleLowerCase().includes(term)));
    const directionFactor = query.get("sort") === "ASC" ? 1 : -1;
    const requestedSort = query.get("sortBy");
    const field = requestedSort === "title" || requestedSort === "message" || requestedSort === "company_name" || requestedSort === "created_at" ? requestedSort : "id";
    matching.sort((left, right) => directionFactor * (field === "id" ? left.id - right.id : left[field].localeCompare(right[field])));
    const limit = Number(query.get("limit"));
    const start = (Number(query.get("page")) - 1) * limit;
    return { data: matching.slice(start, start + limit), filteredRecords: matching.length, totalRecords: scoped.length };
  }, [direction, rows]);

  if (!allowed) return <p role="alert">This section is unavailable for your account.</p>;
  const navTitle = accountFlag(user?.is_seller) ? "Buyer Connects" : "Seller Connects";
  return <>
    <h1 className="h4 mb-3">My Buyer Enquiries</h1>
    {!current && <p role="status">Loading connections…</p>}
    {current?.error && <p role="alert" className="alert alert-danger">{current.error}
      <button className="btn btn-sm btn-link" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
    </p>}
    {rows && <DashboardTable title={navTitle} hideHeading columns={columns} load={load} limitOptions={[10, 25, 50, 100]}
      filterControl={(resetPage) => <select className="form-select form-select-sm w-auto" aria-label="Connection direction" value={direction}
        onChange={(event) => { setDirection(event.target.value); resetPage(); }}>
        <option value="all">All</option>
        <option value="send">Send</option>
        <option value="received">Received</option>
      </select>} />}
  </>;
}
