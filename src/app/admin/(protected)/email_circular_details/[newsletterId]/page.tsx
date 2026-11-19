import { notFound } from "next/navigation";
import AdminEmailCircular from "@/components/admin/AdminEmailCircular";

export default async function Page({ params }: { params: Promise<{ newsletterId: string }> }) {
  const { newsletterId } = await params;
  if (!/^\d{1,12}$/.test(newsletterId)) notFound();
  return <AdminEmailCircular key={newsletterId} circularID={newsletterId} view="details" />;
}
