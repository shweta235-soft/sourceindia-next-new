import PublicShell from "@/components/layout/PublicShell";
import ItemSubcategoryPage from "@/components/public/ItemSubcategoryPage";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 return <PublicShell><ItemSubcategoryPage slug={slug} endpoint="items"/></PublicShell>;
}
