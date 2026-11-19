import { notFound } from "next/navigation";
import AdminMailHistoryDetails from "@/components/admin/AdminMailHistoryDetails";
import { validMailCode } from "@/lib/adminMailHistory";

export default async function MailHistoryDetailsPage({ params, searchParams }: {
  params: Promise<{ mailCode: string }>; searchParams: Promise<{ deleted?: string | string[] }>;
}) {
  const { mailCode } = await params;
  if (!validMailCode(mailCode)) notFound();
  return <AdminMailHistoryDetails key={mailCode} mailCode={mailCode} deleted={(await searchParams).deleted === "true"} />;
}
