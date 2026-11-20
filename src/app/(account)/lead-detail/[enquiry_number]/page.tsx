import MyEnquiryDetail from "@/components/account/MyEnquiryDetail";
import SellerLeadDetail from "@/components/account/SellerLeadDetail";

export default async function Page({ params, searchParams }: {
  params: Promise<{ enquiry_number: string }>;
  searchParams: Promise<{ received?: string }>;
}) {
  const [{ enquiry_number }, { received }] = await Promise.all([params, searchParams]);
  return received === "1" ? <SellerLeadDetail number={enquiry_number} /> : <MyEnquiryDetail number={enquiry_number} />;
}
