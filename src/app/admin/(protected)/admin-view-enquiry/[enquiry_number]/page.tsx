import AdminEnquiryDetail from "@/components/admin/AdminEnquiryDetail";

export default async function Page({ params, searchParams }: {
  params: Promise<{ enquiry_number: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ enquiry_number }, { from }] = await Promise.all([params, searchParams]);
  return <AdminEnquiryDetail id={enquiry_number} from={from} />;
}
