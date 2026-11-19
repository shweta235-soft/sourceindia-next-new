import AdminProductForm from "@/components/admin/AdminProductForm";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <AdminProductForm productId={productId} />;
}
