import { Suspense } from "react";
import PublicShell from "@/components/layout/PublicShell";
import ProductsListing from "@/components/products/ProductsListing";
export default function ProductsPage() {
 return <PublicShell><Suspense fallback={<div className="container-xxl py-5">Loading products...</div>}><ProductsListing /></Suspense></PublicShell>;
}
