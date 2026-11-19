"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";

type Company = {
  id?: number | string;
  organization_slug?: string | null;
  organization_name?: string | null;
  company_logo_file?: string | null;
};
type Response = { companies?: Company[] };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    inFlight.current = true;
    setLoading(true);
    setError(false);
    apiFetch<Response>(`/products/companies?is_delete=0&page=${page}&limit=20`)
      .then((data) => {
        if (!active) return;
        const incoming = Array.isArray(data?.companies) ? data.companies : [];
        if (incoming.length === 0) setHasMore(false);
        setCompanies((prev) => {
          const seen = new Set<string>();
          return [...prev, ...incoming].filter((company) => {
            const key = company.organization_slug || String(company.id ?? "");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) { setLoading(false); inFlight.current = false; } });
    return () => { active = false; };
  }, [page]);

  const loadMore = useCallback(() => {
    if (loading || inFlight.current || !hasMore || error) return;
    inFlight.current = true;
    setPage((current) => current + 1);
  }, [loading, hasMore, error]);

  useEffect(() => {
    if (!hasMore || error || loading || !loaderRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { threshold: 1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, error, loading, loadMore]);

  return <section className="container my-5 si-companies-page">
    <div className="firstHead text-start mb-3">
      <h1 className="mb-0">All Companies</h1>
      <p className="mb-0 text-muted">Browse verified electronics suppliers — view products.</p>
    </div>
    <div className="row row-cols-2 row-cols-md-6 g-4">
      {companies.map((company, index) => {
        const name = company.organization_name || "Company";
        const href = company.organization_slug ? `/companies/${encodeURIComponent(company.organization_slug)}` : null;
        return <div className="col" key={company.organization_slug || company.id || index}>
          <div className="card h-100 shadow-sm text-center company-card">
            <div className="card-body d-flex flex-column align-items-center justify-content-center py-3">
              {href ? <Link href={href} className="d-block w-100 mb-2" aria-label={`View products for ${name}`}>
                <div className="company-logo"><img src={assetUrl(company.company_logo_file)} width={160} height={80} loading="lazy" alt={name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/default.png"; }}/></div>
              </Link> : <div className="company-logo mb-2"><img src={assetUrl(company.company_logo_file)} width={160} height={80} loading="lazy" alt={name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/default.png"; }}/></div>}
              <p className="mt-2 mb-2 company-name"><small>{name}</small></p>
            </div>
            <div className="card-footer bg-transparent border-0 company-footer">
              {href ? <Link className="btn btn-sm btn-outline-primary" href={href} aria-label={`View products for ${name}`}>View</Link> : <button className="btn btn-sm btn-outline-primary" disabled>View</button>}
            </div>
          </div>
        </div>;
      })}
    </div>
    <div ref={loaderRef} style={{ minHeight: 100, textAlign: "center" }} aria-live="polite">
      {loading && <p className="pt-3">Loading companies...</p>}
      {error && <div className="pt-3"><p>Could not load companies.</p><button className="btn btn-outline-primary btn-sm" onClick={() => { setError(false); setPage((p) => p + 1); }}>Retry</button></div>}
      {!hasMore && !loading && <p className="pt-3">No more companies to load</p>}
    </div>
  </section>;
}
