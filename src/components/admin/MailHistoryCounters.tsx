import { mailCount, mailCounters } from "@/lib/adminMailHistory";
import type { LeadRecord } from "@/lib/adminEnquiries";

export default function MailHistoryCounters({ values }: { values?: LeadRecord }) {
  return <div className="row g-3 mb-4">
    {mailCounters.map(([key, label, color, icon]) => <div className="col-12 col-sm-6 col-lg-2" key={key}>
      <div className={`border rounded-3 p-3 h-100 shadow-sm border-${color}-subtle bg-${color}-subtle`}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="small text-muted fw-semibold">{label}</span>
          <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white" style={{ width: 34, height: 34 }}>
            <i className={`bx ${icon} text-${color} fs-5`} aria-hidden="true" />
          </span>
        </div>
        <div className="fw-bold" style={{ fontSize: "1.2rem", lineHeight: 1 }}>{values ? mailCount(values[key]) : "—"}</div>
      </div>
    </div>)}
  </div>;
}
