import { notFound } from "next/navigation";
import AdminUserActivityDetails from "@/components/admin/AdminUserActivityDetails";

export default async function UserActivityDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!/^\d{1,12}$/.test(userId)) notFound();
  return <AdminUserActivityDetails key={userId} userID={userId} />;
}
