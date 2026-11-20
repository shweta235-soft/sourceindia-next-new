import { notFound } from "next/navigation";
import SellerProductForm from "@/components/account/SellerProductForm";
import { sourcingId } from "@/lib/sourcingInterest";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!sourcingId(productId)) notFound();
  return <SellerProductForm key={productId} productId={productId} />;
}
