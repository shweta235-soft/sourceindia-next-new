import PublicShell from "@/components/layout/PublicShell";
import ItemSubcategoryPage from "@/components/public/ItemSubcategoryPage";

export default async function Page({ params }: { params: Promise<{ itemSlug: string }> }) {
  const { itemSlug } = await params;
  return <PublicShell><ItemSubcategoryPage key={itemSlug} slug={itemSlug} level="item-subcategories" /></PublicShell>;
}
