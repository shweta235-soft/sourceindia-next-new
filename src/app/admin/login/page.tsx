import AdminLogin from "@/components/admin/AdminLogin";
import { safeAdminDestination } from "@/lib/adminSession";

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const { returnTo } = await searchParams;
  return <AdminLogin returnTo={safeAdminDestination(returnTo)} />;
}
