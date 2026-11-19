import { notFound } from "next/navigation";
import AdminEmailForm from "@/components/admin/AdminEmailForm";

export default async function EditEmailPage({ params }: { params: Promise<{ emailId: string }> }) {
  const { emailId } = await params;
  if (!/^\d{1,12}$/.test(emailId)) notFound();
  return <AdminEmailForm key={emailId} emailID={emailId} />;
}
