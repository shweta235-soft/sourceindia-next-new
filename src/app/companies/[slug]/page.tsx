import PublicShell from "@/components/layout/PublicShell";
import CompanyDetailPage from "@/components/public/CompanyDetailPage";
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <PublicShell><CompanyDetailPage slug={slug}/></PublicShell>;
}
