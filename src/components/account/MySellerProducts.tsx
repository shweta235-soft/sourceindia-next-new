"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { leadDate, type LeadListResult } from "@/lib/adminEnquiries";
import { canManageSellerProducts, readSellerProducts } from "@/lib/sellerProducts";
import { sourcingId } from "@/lib/sourcingInterest";
import { displayText as text } from "@/lib/userDashboard";
import AdminRowActions from "../admin/AdminRowActions";
import DashboardTable, { type DashboardColumn } from "../admin/DashboardTable";
import { ProductImage } from "../admin/ProductFields";

const load = (query: URLSearchParams, signal: AbortSignal) => readSellerProducts<LeadListResult>(query, signal);

export default function MySellerProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [productName, setProductName] = useState("");
  if (!user || !canManageSellerProducts(user)) return <p role="alert">Product management is available to eligible seller accounts.</p>;

  const columns: DashboardColumn[] = [
    { key: "image", label: "Image", sortable: false, render: (row) => <ProductImage file={row.file_name} /> },
    { key: "title", label: "Title", sortable: true, render: (row) => row.slug ?
      <Link href={`/products/${encodeURIComponent(text(row.slug))}`} target="_blank" rel="noopener noreferrer">{text(row.title)}</Link> : text(row.title) },
    { key: "category_name", label: "Category", sortable: true, render: (row) => text(row.category_name) },
    { key: "created_at", label: "Created At", sortable: true, render: (row) => leadDate(row.created_at) },
    { key: "updated_at", label: "Updated At", sortable: true, render: (row) => leadDate(row.updated_at) },
    { key: "action", label: "Action", sortable: false, render: (row) => {
      const id = sourcingId(row.id);
      const name = text(row.title);
      return id ? <AdminRowActions name={name} actions={[
        { label: "Edit", icon: "bx-edit", onClick: () => router.push(`/edit_product/${id}`) },
        { label: "Delete", icon: "bx-trash", danger: true, onClick: () => {
          setProductName(name);
          dialog.current?.showModal();
        } },
      ]} /> : null;
    } },
  ];

  return <>
    <DashboardTable title="Products" columns={columns} load={load} renderHeading={(total, headingId) =>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h1 id={headingId} className="h4 mb-1">Products <span className="badge bg-primary">{total}</span></h1>
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb mb-0"><li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item">Shop</li><li className="breadcrumb-item active" aria-current="page">Products</li></ol>
          </nav>
        </div>
        <Link className="btn btn-primary" href="/add_product"><i className="bx bxs-plus-square me-1" aria-hidden="true" /> Add Product</Link>
      </div>} />
    <dialog ref={dialog} className="rounded border-0 p-4 shadow" aria-labelledby="delete-product-title">
      <h2 className="h5" id="delete-product-title">Delete Product</h2>
      <p>Are you sure you want to delete {productName}?</p>
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className="btn btn-danger" disabled title="Delete is unavailable in the UI preview">Delete</button>
      </div>
    </dialog>
  </>;
}
