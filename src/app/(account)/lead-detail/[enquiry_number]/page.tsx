import MyEnquiryDetail from "@/components/account/MyEnquiryDetail";

export default async function Page({ params }: { params: Promise<{ enquiry_number: string }> }) {
  const { enquiry_number } = await params;
  return <MyEnquiryDetail number={enquiry_number} />;
}
