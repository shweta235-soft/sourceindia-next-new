import AdminEnquiryDetail from "@/components/admin/AdminEnquiryDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminEnquiryDetail id={id} open />;
}
