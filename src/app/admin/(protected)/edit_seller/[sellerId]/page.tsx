import MemberDetails from "@/components/admin/MemberDetails";

export default async function Page({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  return <MemberDetails kind="sellers" mode="edit" id={sellerId} />;
}
