"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import LegalDescriptionEditor from "./LegalDescriptionEditor";
import legalStyles from "./admin-legal-page.module.css";
import styles from "./catalog-master.module.css";

type PageContent = { title: string; description: string };
type PageResponse = Partial<PageContent> & { data?: Partial<PageContent> };

export default function AdminLegalPage({ pageId, title }: { pageId: 8 | 9; title: string }) {
  const [result, setResult] = useState<{ page?: PageContent; failed?: boolean }>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<PageResponse>(`pages/${pageId}`, { signal: controller.signal }).then((response) => {
      const page = response?.data ?? response;
      if (typeof page?.title !== "string" || typeof page.description !== "string") throw new Error("Invalid page response.");
      if (!controller.signal.aborted) setResult({ page: { title: page.title, description: page.description } });
    }).catch(() => { if (!controller.signal.aborted) setResult({ failed: true }); });
    return () => controller.abort();
  }, [pageId, attempt]);

  return <div className={`p-0 ${styles.master}`}>
    <div className="mb-2">
      <h1 className={`h4 mb-1 ${styles.heading} ${legalStyles.heading}`}>{title}</h1>
      <nav aria-label="Breadcrumb" className="d-none d-sm-block mb-3">
        <ol className={`breadcrumb mb-0 ${legalStyles.breadcrumb}`}>
          <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
          <li className="breadcrumb-item">Pages</li>
          <li className="breadcrumb-item active" aria-current="page">{title}</li>
        </ol>
      </nav>
    </div>
    <div className="card"><div className="card-body">
      <h5 className="card-title mb-3">Edit {title}</h5>
      {!result ? <p role="status">Loading...</p> : result.failed ? <p role="alert">
        Failed to load page. <button type="button" className="btn btn-sm btn-link" onClick={() => {
          setResult(undefined);
          setAttempt((previous) => previous + 1);
        }}>Retry</button>
      </p> : result.page && <form onSubmit={(event) => event.preventDefault()}>
        <div className="mb-3">
          <label htmlFor="legal-page-title" className="form-label">Title</label>
          <input id="legal-page-title" className="form-control" defaultValue={result.page.title} placeholder="Title" />
        </div>
        <div className="mb-3">
          <LegalDescriptionEditor description={result.page.description} />
        </div>
        <button type="submit" className="btn btn-primary" disabled>Update</button>
      </form>}
    </div></div>
  </div>;
}
