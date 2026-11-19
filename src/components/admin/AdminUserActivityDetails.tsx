"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leadDate, leadText } from "@/lib/adminEnquiries";
import { activityStatus, activityUserType, getUserActivityData, userActivityPath, type UserActivityDetail } from "@/lib/adminUserActivity";
import ReportsBreadcrumb from "./ReportsBreadcrumb";

export default function AdminUserActivityDetails({ userID }: { userID: string }) {
  const [result, setResult] = useState<{ row?: UserActivityDetail; error?: string }>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getUserActivityData<UserActivityDetail>("detail", new URLSearchParams({ id: userID }), controller.signal).then((row) => {
      if (!controller.signal.aborted) setResult({ row });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ error: error instanceof Error ? error.message : "User activity history could not be loaded." });
    });
    return () => controller.abort();
  }, [attempt, userID]);

  const user = result?.row;
  const summary = user ? [
    ["Full Name", [leadText(user.user_fname), leadText(user.user_lname)].filter(Boolean).join(" ")],
    ["Status", activityStatus(user.user_status)],
    ["Is Seller", <span className="badge bg-primary" key="type">{activityUserType(user.user_is_seller)}</span>],
    ["Last Updated", leadDate(user.user_updated_at)],
  ] as const : [];

  return <>
    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
      <ReportsBreadcrumb page="User Activities" title="User Activity Details" />
      <Link className="btn btn-sm btn-primary mb-3" href={userActivityPath}>Back</Link>
    </div>
    {!result && <p role="status">Loading user activity history…</p>}
    {result?.error && <p role="alert">{result.error} <button type="button" className="btn btn-link btn-sm" onClick={() => {
      setResult(undefined);
      setAttempt((previous) => previous + 1);
    }}>Retry</button></p>}
    {user && <>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4">
        {summary.map(([label, value]) => <div className="col mb-3" key={label}>
          <div className="card radius-10 overflow-hidden border border-primary h-100"><div className="card-body">
            <strong>{label}</strong><p className="mb-0">{value}</p>
          </div></div>
        </div>)}
      </div>
      <div className="card mb-3"><div className="card-body"><div className="table-responsive">
        <table className="table table-striped table-bordered dataTable mt-2">
          <thead><tr><th scope="col">Type</th><th scope="col">Is Side</th><th scope="col">Created Date</th></tr></thead>
          <tbody>{user.user_activity.length ? user.user_activity.map((row, index) => (
            <tr key={leadText(row.id) || index}><td>{leadText(row.type)}</td><td>{leadText(row.is_side)}</td><td>{leadDate(row.created_at)}</td></tr>
          )) : <tr><td colSpan={3} className="text-center">No records found.</td></tr>}</tbody>
        </table>
      </div></div></div>
    </>}
  </>;
}
