import PublicShell from "@/components/layout/PublicShell";
import "@/legacy-assets/css/product-detail.css";
import "@/legacy-assets/css/companydetails.css";
import ProductDetail from "@/components/products/ProductDetail";
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <PublicShell><ProductDetail slug={slug}/></PublicShell>;
}
