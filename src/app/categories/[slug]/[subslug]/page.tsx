import PublicShell from "@/components/layout/PublicShell";
import ItemSubcategoryPage from "@/components/public/ItemSubcategoryPage";
export default async function Page({params}:{params:Promise<{slug:string;subslug:string}>}){
 const {subslug}=await params;
 return <PublicShell><ItemSubcategoryPage slug={subslug}/></PublicShell>;
}
