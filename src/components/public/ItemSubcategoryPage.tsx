"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import LatestProductSlider from "../home/LatestProductSlider";

const endpoints = {
  "item-categories": "categories/item-category",
  "item-subcategories": "categories/sub-items",
  items: "categories/items",
};
type Named = { id: number | string; name: string; slug?: string };
type Item = Named & { file_name?: string | null; product_count?: number | string };
type Group = Item & { items?: Item[] };
type Detail = Named & { category?: Named; sub_category?: Named; item_categories?: Group[] };
type Result = { subcategory?: Detail; pagination?: { hasMore?: boolean } };
type SliderProducts = ComponentProps<typeof LatestProductSlider>["products"];

function CategorySlider({ category, parent, group }: { category: Named; parent: Named; group: Group }) {
  const [products, setProducts] = useState<SliderProducts>([]);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      category: String(category.id), sub_category: String(parent.id), item_category_id: String(group.id),
      is_delete: "0", status: "1", is_approve: "1", is_front: "1", limit: "10", sort_by: "newest",
    });
    void apiFetch<{ products?: SliderProducts }>(`products?${query}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted && Array.isArray(result.products)) setProducts(result.products.filter((row) => row.slug)); })
      .catch(() => {});
    return () => controller.abort();
  }, [category.id, parent.id, group.id]);
  return <LatestProductSlider products={products} categoryName={group.name} />;
}

export default function ItemSubcategoryPage({ slug, level }: { slug: string; level: keyof typeof endpoints }) {
  const [detail, setDetail] = useState<Detail>();
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; hasMore: boolean; error?: boolean }>();
  const key = `${slug}:${level}:${page}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ slug, page: String(page), limit: "8" });
    void apiFetch<Result>(`${endpoints[level]}?${query}`, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      const next = data.subcategory;
      if (!next && page > 1) throw new Error("Missing category data.");
      setDetail((previous) => page === 1 || !next ? next : {
        ...next, item_categories: [...new Map([...(previous?.item_categories ?? []), ...(next.item_categories ?? [])]
          .map((group) => [String(group.id), group])).values()],
      });
      setResult({ key, hasMore: Boolean(data.pagination?.hasMore) });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, error: true, hasMore: false });
    });
    return () => controller.abort();
  }, [key, level, page, slug]);

  const current = result?.key === key ? result : undefined;
  const category = detail?.category;
  const parent = detail?.sub_category;
  const showCategories = level === "item-categories";
  const groups = (detail?.item_categories ?? []).filter((group) => !showCategories || Number(group.product_count) > 0);
  const retry = <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={() => setAttempt((n) => n + 1)}>Retry</button>;

  return <section className="categorySection py-md-4 pt-2 my-4"><div className="container-xxl">
    {!detail ? current?.error ? <p role="alert">Unable to load item categories. Please try again later.{retry}</p>
      : current ? <p>Subcategory not found.</p>
        : <div role="status" aria-label="Loading item categories" className="card"><div className="card-body row g-3 placeholder-glow">
          {Array.from({ length: 12 }, (_, index) => <div key={index} className="col-6 col-md-3 col-lg-2">
            <span className="placeholder w-100" style={{ height: 125 }} /><span className="placeholder col-9 mt-2" />
          </div>)}
        </div></div>
      : <>
        <nav aria-label="Breadcrumb" className="mb-3"><ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href="/">Home</Link></li>
          <li className="breadcrumb-item"><Link href="/categories">Categories</Link></li>
          {category?.slug && <li className="breadcrumb-item"><Link href={`/categories/${encodeURIComponent(category.slug)}`}>{category.name}</Link></li>}
          {category?.slug && parent?.slug && <li className="breadcrumb-item">
            <Link href={`/categories/${encodeURIComponent(category.slug)}/${encodeURIComponent(parent.slug)}`}>{parent.name}</Link>
          </li>}
          <li className="breadcrumb-item active" aria-current="page">{detail.name}</li>
        </ol></nav>
        <h1 className="h4 fw-semibold mb-4">{detail.name}</h1>
        {groups.length === 0 && <p className="text-center text-muted">No item categories found.</p>}
        {groups.map((group) => {
          const filters = showCategories && category ? {
            category_id: String(category.id), subcategory_id: String(detail.id), item_category_id: String(group.id),
          } : undefined;
          const items = (group.items ?? []).filter((item) => !showCategories || Number(item.product_count) > 0);
          return <div className="card mb-3 card-border" key={group.id}><div className="card-body">
            {filters ? <Link href={{ pathname: "/products", query: filters }} className="d-flex justify-content-between text-decoration-none">
              <h2 className="h6 fw-semibold text-orange">{group.name} ({group.product_count})</h2><span aria-hidden="true">→</span>
            </Link> : <h2 className="h6 fw-semibold mb-3 text-capitalize">{group.name}</h2>}
            <div className="row g-3">
              {items.map((item) => <div key={item.id} className="col-6 col-sm-4 col-md-3 col-lg-2 text-center itemcolblock mb-3">
                <div className="border rounded p-3 h-100">
                  <Link href={{ pathname: "/products", query: filters ? { ...filters, item_subcategory_id: String(item.id) } : { item_id: String(item.id) } }} className="text-decoration-none">
                    <img src={assetUrl(item.file_name)} alt={item.name} className="img-fluid rounded mb-2 w-100"
                      style={{ height: 125, objectFit: "contain" }} loading="lazy" decoding="async"
                      onError={(event) => { if (!event.currentTarget.src.endsWith("/default.png")) event.currentTarget.src = "/default.png"; }} />
                    <h3 className="small fw-semibold mb-1" title={item.name}>{item.name.length > 45 ? `${item.name.slice(0, 45)}...` : item.name}</h3>
                  </Link>
                  {Number(item.product_count) > 0 && <div className="text-success small">({item.product_count})</div>}
                </div>
              </div>)}
              {!items.length && <p className="text-muted small">No items found.</p>}
            </div>
            {showCategories && category && <CategorySlider category={category} parent={detail} group={group} />}
          </div></div>;
        })}
        {!current && <p className="text-center" role="status">Loading more items…</p>}
        {current?.error && <p className="text-center text-danger" role="alert">Could not load more items.{retry}</p>}
        {current?.hasMore && <div className="text-center mt-4">
          <button type="button" className="btn btn-outline-primary btn-sm px-4" onClick={() => setPage((n) => n + 1)}>Load More +</button>
        </div>}
      </>}
  </div></section>;
}
