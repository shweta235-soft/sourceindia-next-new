import { Suspense } from "react";
import PublicShell from "@/components/layout/PublicShell";
import CompanyListingFilter from "@/components/public/CompanyListingFilter";
export default function Page() { return <PublicShell><Suspense fallback={<p className="container py-5">Loading...</p>}><CompanyListingFilter mode="buyer" /></Suspense></PublicShell>; }
