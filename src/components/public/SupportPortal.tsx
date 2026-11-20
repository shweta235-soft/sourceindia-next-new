import type { ReactNode } from "react";

export default function SupportPortal({ title = "Support Portal", subtitle, children }: {
  title?: string; subtitle?: string; children: ReactNode;
}) {
  return <section className="my-5">
    <div className="container">
      <div className="card mb-lg-5 mb-3 commonHead border shodow-none">
        <div className="card-body py-5 d-flex align-items-center justify-content-center">
          <div className="firstHead text-center text-break">
            <h1 className="mb-0 text-white">{title}</h1>
            {subtitle && <p className="text-white mt-2 mb-0">{subtitle}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  </section>;
}
