"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCircularData, type Circular } from "@/lib/adminCircular";
import { leadText, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import DashboardTable, { type DashboardColumn } from "./DashboardTable";
import styles from "./email-circular.module.css";

const stats = [
  ["all", "All Users", "success", "bxs-user"],
  ["mailSent", "Sent Mail", "info", "bx-mail-send"],
  ["mailUnSent", "Un Sent Mail", "danger", "bx-mail-send"],
  ["mailOpen", "Open Mail", "warning", "bx-mail-send"],
  ["mailNotOpen", "Not Open Mail", "warning", "bx-mail-send"],
] as const;

function MailBadge({ value }: { value: boolean }) {
  return <span className={`badge ${value ? "bg-success" : "bg-danger"}`}>{value ? "Yes" : "No"}</span>;
}

const columns: DashboardColumn[] = [
  { key: "user_name", label: "User Name", render: (row) => {
    const name = leadText(row.user_name);
    const id = leadText(row.user_id);
    return /^\d{1,12}$/.test(id) ?
      <Link href={`/admin/${leadText(row.user_is_seller) === "1" ? "seller" : "buyer"}/user-profile/${id}`}>{name}</Link> : name;
  } },
  { key: "is_mail", label: "User Type", sortable: false, render: (row) => <MailBadge value={leadText(row.is_mail) === "1"} /> },
  { key: "email_view_count", label: "Is Mail Open", sortable: false, render: (row) => <MailBadge value={Number(row.email_view_count) > 0} /> },
  { key: "action", label: "Action", sortable: false, render: () => <button className="btn btn-primary btn-sm" type="button" disabled>Resend</button> },
];

export default function EmailCircularDetails({ circularID }: { circularID: string }) {
  const [details, setDetails] = useState<{ row?: Circular; error?: string }>();
  const [counts, setCounts] = useState<LeadRecord>();
  const [countsError, setCountsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ id: circularID });
    void getCircularData<Circular>("detail", params, controller.signal).then((row) => {
      if (!controller.signal.aborted) setDetails({ row });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setDetails({ error: error instanceof Error ? error.message : "Email circular could not be loaded." });
    });
    void getCircularData<LeadRecord>("counts", params, controller.signal).then((row) => {
      if (!controller.signal.aborted) setCounts(row);
    }).catch(() => {
      if (!controller.signal.aborted) setCountsError("Mail counts could not be loaded.");
    });
    return () => controller.abort();
  }, [circularID]);

  const load = useCallback((params: URLSearchParams, signal: AbortSignal) => {
    params.set("id", circularID);
    return getCircularData<LeadListResult>("history", params, signal);
  }, [circularID]);

  const description = leadText(details?.row?.description);
  // Keep stored email content in an isolated document with remote resources disabled.
  const preview = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>body{margin:0;font:14px/1.5 system-ui,sans-serif;color:#212529}img{max-width:100%}</style>${description}`;

  return <>
    <div className="card mb-3"><div className="card-body">
      {!details && <p role="status" className="mb-0">Loading email circular…</p>}
      {details?.error && <p role="alert" className="mb-0">{details.error}</p>}
      {details?.row && <h2>{leadText(details.row.subject)}</h2>}
      {description && <iframe className={styles.preview} sandbox="" title="Email circular content" srcDoc={preview} />}
    </div></div>

    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4" aria-busy={!counts && !countsError}>
      {stats.map(([key, label, color, icon]) => <div className="col" key={key}>
        <div className="card radius-10 mb-3"><div className="card-body">
          <div className="d-flex align-items-center">
            <div><p className="mb-0 text-secondary">{label}</p><h4 className="my-1">{leadText(counts?.[key]) || "—"}</h4></div>
            <div className={`widgets-icons bg-${color}-subtle text-${color} ms-auto ${styles.statIcon}`}>
              <i className={`bx ${icon}`} aria-hidden="true" />
            </div>
          </div>
        </div></div>
      </div>)}
    </div>
    {countsError && <p role="alert" className="text-danger">{countsError}</p>}
    <DashboardTable title="Email Circular Recipients" hideHeading columns={columns} load={load} />
  </>;
}
