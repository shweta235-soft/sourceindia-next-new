import { notFound } from "next/navigation";
import OpenEnquiryDetails from "@/components/account/OpenEnquiryDetails";
import { sourcingId } from "@/lib/sourcingInterest";

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  const enquiryId = sourcingId(id);
  if (!enquiryId) notFound();
  return <OpenEnquiryDetails id={enquiryId} scope={type === "1" ? "all" : "mine"} />;
}
