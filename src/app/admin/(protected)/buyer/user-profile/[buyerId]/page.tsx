import MemberDetails from "@/components/admin/MemberDetails";

export default async function Page({ params }: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = await params;
  return <MemberDetails kind="buyers" mode="profile" id={buyerId} />;
}
