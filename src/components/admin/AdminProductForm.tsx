"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { changeHierarchy, hierarchyFields, hierarchyPaths, ProductImage, ProductSelect, productStatuses, text, type ProductRow } from "./ProductFields";
import styles from "./catalog-master.module.css";

const flags = [
  ["is_gold", "Gold"], ["is_featured", "Featured"], ["is_recommended", "Recommended"], ["best_product", "Best Product"],
] as const;
const formStatuses = productStatuses.filter(({ id }) => id !== 2);

function Fields({ product }: { product?: ProductRow }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(
    [...hierarchyFields.map(([field]) => field), "user_id", "keyword_id", "status", "application"]
      .map((field) => [field, text(product?.[field])]),
  ));
  const [files, setFiles] = useState<File[]>([]);
  const endpoints = hierarchyPaths(values, false);
  const images = Array.isArray(product?.images) ? product.images as ProductRow[] : [];
  const setValue = (field: string, value: string) => setValues((previous) => ({ ...previous, [field]: value }));

  return <form className="row g-3" onSubmit={(event) => event.preventDefault()}>
    <div className="col-md-8"><div className="card"><div className="card-body p-4">
      <div className="row">
        <div className="col-12 mb-3"><ProductSelect label="User" endpoint="sellers?is_delete=0&status=1&is_complete=1"
          value={values.user_id} onChange={(value) => setValue("user_id", value)} nameKey="company_name" emptyLabel="Select user" required /></div>
        <div className="col-12 mb-3">
          <label className="form-label required" htmlFor="product-title">Product/Service Name</label>
          <input id="product-title" type="text" className="form-control" placeholder="Product Name" defaultValue={text(product?.title)} required />
        </div>
        {[["code", "Sku"], ["article_number", "Part Number"]].map(([field, label]) => <div className="col-md-6 mb-3" key={field}>
          <label className="form-label" htmlFor={field}>{label}</label>
          <input id={field} type="text" className="form-control" defaultValue={text(product?.[field])} />
        </div>)}
        <div className="col-12 d-flex flex-wrap gap-3 mb-3">
          {flags.map(([field, label]) => <div key={field} className="form-check">
            <input className="form-check-input" id={field} type="checkbox" defaultChecked={Number(product?.[field]) === 1} />
            <label className="form-check-label" htmlFor={field}>{label}</label>
          </div>)}
        </div>
        <div className="col-md-6 mb-3"><ProductSelect label="Status" entries={formStatuses} emptyLabel="Select here"
          value={values.status} onChange={(value) => setValue("status", value)} required /></div>
        <div className="col-md-6 mb-3"><ProductSelect label="Applications" endpoint="applications"
          value={values.application} onChange={(value) => setValue("application", value)} emptyLabel="Select application" /></div>
        <div className="col-12 mb-3">
          <label className="form-label" htmlFor="short-description">Short Specifications</label>
          <textarea id="short-description" className="form-control" rows={3} placeholder="Short Specifications" defaultValue={text(product?.short_description)} />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="long-description">Long Specifications</label>
          <textarea id="long-description" className="form-control" rows={6} defaultValue={text(product?.description)} />
        </div>
      </div>
    </div></div></div>
    <div className="col-md-4"><div className="card"><div className="card-body p-4">
      {hierarchyFields.map(([field, label], index) => <div className="mb-3" key={field}>
        {field === "item_id" && <div className="mb-3">
          <ProductSelect label="Keyword" endpoint={values.item_subcategory_id ? `keywords/by-subcategory/${encodeURIComponent(values.item_subcategory_id)}` : ""}
            value={values.keyword_id} onChange={(value) => setValue("keyword_id", value)} emptyLabel="Select Keyword" />
        </div>}
        <ProductSelect label={field === "item_id" ? "Items" : label} endpoint={endpoints[index]} value={values[field]}
          emptyLabel={`Select ${label}`} required={index < 2} onChange={(value) => setValues((previous) => ({
            ...changeHierarchy(previous, index, value),
            ...(index < 4 ? { keyword_id: "" } : {}),
          }))} />
      </div>)}
      <label className="form-label required d-block" htmlFor="product-files">Product Images</label>
      <input className="form-control" id="product-files" type="file" accept="image/png,image/jpeg" multiple
        onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
      {files.length > 0 && <ul className="small mt-2 ps-3 mb-0">{files.map((file, index) =>
        <li key={`${file.name}-${index}`}>{file.name}</li>)}</ul>}
      {images.length > 0 && <div className="d-flex flex-wrap gap-2 mt-3">
        {images.map((image, index) => <ProductImage key={text(image.id) || index} file={image.file} size={80} />)}
      </div>}
    </div></div></div>
    <div className="col-12 text-end mt-2"><button type="submit" className="btn btn-sm btn-primary px-4 mt-3" disabled>
      {product ? "Update" : "Save"}
    </button></div>
  </form>;
}

export default function AdminProductForm({ productId }: { productId?: string }) {
  const [result, setResult] = useState<{ id: string; product?: ProductRow; failed?: boolean }>();
  const title = productId ? "Edit Product" : "Add Product";
  useEffect(() => {
    if (!productId) return;
    const id = productId;
    const controller = new AbortController();
    apiFetch<ProductRow>(`products/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((product) => {
        if (!product || !("id" in product)) throw new Error("Invalid product response");
        if (!controller.signal.aborted) setResult({ id, product });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ id, failed: true }); });
    return () => controller.abort();
  }, [productId]);

  const current = result?.id === productId ? result : undefined;
  return <div className={styles.master}>
    <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
      <nav aria-label="breadcrumb" className="page-breadcrumb mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
          <li className="breadcrumb-item"><Link href="/admin/products">Products</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{title}</li>
        </ol>
      </nav>
      <Link href="/admin/products" className="btn btn-primary mb-2">Back</Link>
    </div>
    {productId && current?.failed ? <p className="alert alert-danger" role="alert">Product could not be loaded.</p> :
      productId && !current ? <p role="status">Loading product...</p> :
        <Fields key={productId ?? "new"} product={current?.product} />}
  </div>;
}
