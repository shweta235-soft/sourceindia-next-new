import PublicShell from "@/components/layout/PublicShell";
import SubcategoriesPage from "@/components/public/SubcategoriesPage";
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <PublicShell><SubcategoriesPage slug={slug}/></PublicShell>;
}
