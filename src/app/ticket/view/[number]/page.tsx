import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";
import SupportTicketDetails from "@/components/public/SupportTicketDetails";
import { validTicketNumber } from "@/lib/publicSupport";

export const metadata: Metadata = { title: "Support Ticket | SourceIndia", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!validTicketNumber(number)) notFound();
  return <PublicShell><SupportTicketDetails key={number} number={number} /></PublicShell>;
}
