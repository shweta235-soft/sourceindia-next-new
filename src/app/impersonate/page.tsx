import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account Access | SourceIndia",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Preview only. URL tokens are never accepted as a login session. */
export default function ImpersonatePage() {
  return (
    <main className="container py-5" style={{ minHeight: "55vh" }}>
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 580 }}>
        <div className="card-body text-center p-4 p-lg-5">
          <span className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3" style={{ width: 64, height: 64 }} aria-hidden="true">
            <i className="bx bx-lock-alt fs-2 text-primary" />
          </span>
          <h1 className="h4 mb-3">Secure account access</h1>
          <p className="text-secondary mb-4">
            Account switching is not available in this UI preview. Please sign in using your own account.
          </p>
          <Link href="/login" className="btn btn-primary px-4">Go to Login</Link>
        </div>
      </div>
    </main>
  );
}
