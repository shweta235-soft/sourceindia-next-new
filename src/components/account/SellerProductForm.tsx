"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { FiBox, FiCheckCircle, FiImage } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { canManageSellerProducts, readSellerProducts } from "@/lib/sellerProducts";
import { sourcingId } from "@/lib/sourcingInterest";
import { displayText as text } from "@/lib/userDashboard";
import LegalDescriptionEditor from "../admin/LegalDescriptionEditor";
import { hierarchyPaths, ProductImage, ProductSelect } from "../admin/ProductFields";
import "./seller-product.css";

type ProductDetails = { images?: { id: string; file: string }[] } & Record<string, unknown>;
type Suggestion = { id: number; title: string; hierarchy: Record<string, string> };
type LocalImage = { id: number; file: File };

function hierarchy(row: ProductDetails) {
  return Object.fromEntries(["category", "sub_category", "item_category_id", "item_subcategory_id"]
    .map((key) => [key, String(sourcingId(row[key]) || "")]));
}

function ImagePreview({ file }: { file: File }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return source ? <img src={source} alt={file.name} width={80} height={80} className="rounded object-fit-cover" /> : null;
}

function ProductForm({ initial, editing }: { initial: ProductDetails; editing: boolean }) {
  const id = useId();
  const heading = editing ? "Edit Product" : "Add Product";
  const fileInput = useRef<HTMLInputElement>(null);
  const nextImageId = useRef(0);
  const [title, setTitle] = useState(text(initial.title));
  const [selection, setSelection] = useState<Record<string, string>>(() => hierarchy(initial));
  const [activeSuggestion, setActiveSuggestion] = useState<number | "other">();
  const [lookingUp, setLookingUp] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<{ query: string; rows: Suggestion[]; failed?: boolean }>();
  const [savedImages, setSavedImages] = useState(initial.images ?? []);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [imageError, setImageError] = useState("");
  const query = title.trim();

  useEffect(() => {
    if (query.length < 2 || !lookingUp) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ query });
      void apiFetch<{ data?: ProductDetails[] }>(`products/suggest?${params}`, { signal: controller.signal })
        .then(({ data }) => {
          if (!Array.isArray(data)) throw new Error("Invalid suggestion response");
          const rows = data.flatMap((row) => {
            const id = sourcingId(row.id);
            const title = text(row.title).trim();
            return id && title ? [{ id, title, hierarchy: hierarchy(row) }] : [];
          });
          if (!controller.signal.aborted) setResult({ query, rows });
        })
        .catch(() => { if (!controller.signal.aborted) setResult({ query, rows: [], failed: true }); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, lookingUp]);

  const matches = result?.query === query ? result : undefined;

  function typeTitle(value: string) {
    if (value.trim() !== query) setResult(undefined);
    setTitle(value);
    setActiveSuggestion(undefined);
    setLookingUp(true);
    setShowSuggestions(true);
    setSelection({});
  }

  function choose(suggestion?: Suggestion) {
    setLookingUp(false);
    setShowSuggestions(false);
    setActiveSuggestion(suggestion?.id ?? "other");
    setSelection(suggestion?.hierarchy ?? {});
    if (suggestion) setTitle(suggestion.title);
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const valid = files.filter((file) => ["image/png", "image/jpeg"].includes(file.type) && file.size <= 2 * 1024 * 1024);
    setImageError(valid.length === files.length ? "" : "Choose PNG or JPEG images of up to 2 MB each.");
    const previews = valid.map((file) => ({ id: nextImageId.current++, file }));
    setLocalImages((previous) => [...previous, ...previews]);
  }

  return <div className="seller-product-ui add-product-page">
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb">
        <li className="breadcrumb-item"><Link href="/">Home</Link></li>
        <li className="breadcrumb-item"><Link href="/my-product">Product</Link></li>
        <li className="breadcrumb-item active" aria-current="page">{heading}</li>
      </ol>
    </nav>
    <header className="add-product-header">
      <span className="add-product-header-icon"><FiBox aria-hidden="true" /></span>
      <div><h1>{heading}</h1><p>Add clear product details, specifications and images for better visibility.</p></div>
    </header>
    <form className="row g-3 add-product-form" onSubmit={(event) => event.preventDefault()}>
      <div className="col-md-8">
        <div className="card product-form-card">
          <div className="card-body row g-3 m-0">
            <div className="col-12 mt-0" onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShowSuggestions(false);
            }} onKeyDown={(event) => { if (event.key === "Escape") setShowSuggestions(false); }}>
              <label htmlFor={`${id}-title`} className="form-label required">Product/Service Name</label>
              <div className="position-relative">
                <input id={`${id}-title`} className="form-control pe-5" value={title} maxLength={255} required
                  placeholder="Product/Service Name" autoComplete="off"
                  onChange={(event) => typeTitle(event.target.value)}
                  onFocus={() => { if (lookingUp) setShowSuggestions(true); }} />
                {title && <button type="button" className="seller-product-clear btn btn-sm" aria-label="Clear Product Name"
                  onClick={() => { typeTitle(""); setShowSuggestions(false); }}>×</button>}
                {lookingUp && showSuggestions && query.length >= 2 && <div className="seller-product-suggestions">
                  {matches?.rows.length ? matches.rows.map((item) => <button key={item.id} type="button" onClick={() => choose(item)}>
                    {item.title}
                  </button>) : <div className="p-2 text-muted" role="status">
                    {!matches ? "Loading..." : matches.failed ? "Suggestions could not be loaded." : "No suggestions found"}
                  </div>}
                </div>}
              </div>
              {(matches || activeSuggestion) && query.length >= 2 && <div className="d-flex flex-wrap gap-2 mt-2">
                {matches?.rows.map((item) => <button key={item.id} type="button" aria-pressed={activeSuggestion === item.id}
                  className={`btn rounded-pill px-2 py-1 seller-product-tag ${activeSuggestion === item.id ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => choose(item)}>{item.title}</button>)}
                <button type="button" aria-pressed={activeSuggestion === "other"}
                  className={`btn rounded-pill px-2 py-1 seller-product-tag ${activeSuggestion === "other" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => choose()}>Other</button>
              </div>}
            </div>
            <div className="col-md-4">
              <label htmlFor={`${id}-code`} className="form-label">Sku</label>
              <input id={`${id}-code`} className="form-control" placeholder="Sku" defaultValue={text(initial.code)} />
            </div>
            <div className="col-md-4">
              <label htmlFor={`${id}-part`} className="form-label">Part Number</label>
              <input id={`${id}-part`} className="form-control" type="number" placeholder="Part Number" defaultValue={text(initial.article_number)} />
            </div>
            <div className="col-md-4">
              <label htmlFor={`${id}-status`} className="form-label required">Status</label>
              <select id={`${id}-status`} className="form-control" defaultValue={text(initial.status)} required>
                <option value="">Select here</option>
                <option value="1">Public</option>
                <option value="0">Draft</option>
              </select>
            </div>
            <div className="col-12">
              <label htmlFor={`${id}-short`} className="form-label">Short Specifications</label>
              <textarea id={`${id}-short`} className="form-control" placeholder="Short Specifications" rows={3} defaultValue={text(initial.short_description)} />
            </div>
            <div className="col-12">
              <LegalDescriptionEditor label="Long Specifications *" description={text(initial.description)} />
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card product-form-card">
          <div className="card-body">
            <ProductSelect label="Item Sub Category" value={selection.item_subcategory_id ?? ""}
              emptyLabel="Select Item Sub Category" endpoint={hierarchyPaths(selection, false)[3]}
              onChange={(value) => setSelection((previous) => ({ ...previous, item_subcategory_id: value }))} />
          </div>
        </div>
        <div className="card mt-3 product-form-card">
          <div className="card-body">
            <label htmlFor={`${id}-images`} className="form-label required d-block">Product Images</label>
            <input id={`${id}-images`} type="file" multiple accept="image/png,image/jpeg" className="d-none" ref={fileInput} onChange={addImages} />
            <button type="button" className="product-image-add" onClick={() => fileInput.current?.click()}><FiImage aria-hidden="true" /> Add Images</button>
            {imageError && <div className="text-danger small mt-1" role="alert">{imageError}</div>}
            {(savedImages.length > 0 || localImages.length > 0) && <div className="d-flex flex-wrap gap-3 mt-3">
              {savedImages.map(({ id, file }) => <div className="seller-product-image position-relative" key={id}>
                <ProductImage size={80} file={file} />
                <button type="button" className="btn btn-sm btn-danger" aria-label="Remove product image from preview"
                  onClick={() => setSavedImages((previous) => previous.filter((image) => image.id !== id))}>×</button>
              </div>)}
              {localImages.map(({ id, file }) => <div className="seller-product-image position-relative" key={id}>
                <ImagePreview file={file} />
                <button type="button" className="btn btn-sm btn-danger" aria-label={`Remove ${file.name}`}
                  onClick={() => setLocalImages((previous) => previous.filter((image) => image.id !== id))}>×</button>
              </div>)}
            </div>}
          </div>
        </div>
      </div>
      <div className="col-12 add-product-actions">
        <button type="submit" className="product-save-btn" disabled title="Saving is unavailable in the UI preview">
          <FiCheckCircle aria-hidden="true" /> {editing ? "Update Product" : "Save Product"}
        </button>
      </div>
    </form>
  </div>;
}

export default function SellerProductForm({ productId }: { productId?: string }) {
  const { user } = useAuth();
  const allowed = Boolean(user && canManageSellerProducts(user));
  const userId = text(user?.id);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${userId}:${productId}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: ProductDetails; error?: string }>();

  useEffect(() => {
    if (!productId || !allowed) return;
    const controller = new AbortController();
    void readSellerProducts<ProductDetails>(new URLSearchParams({ id: productId }), controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult({ key: requestKey, data }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message }); });
    return () => controller.abort();
  }, [productId, allowed, requestKey]);

  if (!allowed) return <p role="alert">Product management is available to eligible seller accounts.</p>;
  if (!productId) return <ProductForm key={userId} initial={{}} editing={false} />;
  const loaded = result?.key === requestKey ? result : undefined;
  if (!loaded) return <p role="status">Loading product…</p>;
  if (!loaded.data) return <div role="alert">{loaded.error}
    <button className="btn btn-link" type="button" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button>
    <Link href="/my-product">My Products</Link>
  </div>;
  return <ProductForm key={requestKey} initial={loaded.data} editing />;
}
