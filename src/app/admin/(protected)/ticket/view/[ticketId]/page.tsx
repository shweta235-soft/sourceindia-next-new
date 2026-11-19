import { notFound } from "next/navigation";
import AdminTicketDetail from "@/components/admin/AdminTicketDetail";

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  if (!/^\d{1,12}$/.test(ticketId)) notFound();
  return <AdminTicketDetail key={ticketId} ticketId={ticketId} />;
}
