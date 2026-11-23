import PublicShell from "@/components/layout/PublicShell";
import ItemSubcategoryPage from "@/components/public/ItemSubcategoryPage";

export default async function Page({ params }: { params: Promise<{ subslug: string }> }) {
  const { subslug } = await params;
  return <PublicShell><ItemSubcategoryPage key={subslug} slug={subslug} level="item-categories" /></PublicShell>;
}
