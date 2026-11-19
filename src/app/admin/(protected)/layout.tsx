import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { adminSessionCookie, readAdminSession } from "@/lib/adminSession";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = readAdminSession((await cookies()).get(adminSessionCookie)?.value);
  if (!session) redirect("/admin/login");
  return <AdminShell expires={session.expires}>{children}</AdminShell>;
}
