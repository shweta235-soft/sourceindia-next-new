import PublicShell from "@/components/layout/PublicShell";
import SupportPortal from "@/components/public/SupportPortal";
import TrackSupportTicket from "@/components/public/TrackSupportTicket";

export default function Page() {
  return <PublicShell><SupportPortal><TrackSupportTicket /></SupportPortal></PublicShell>;
}
