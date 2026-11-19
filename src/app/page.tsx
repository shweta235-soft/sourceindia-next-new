import PublicShell from "@/components/layout/PublicShell";
import Homepage from "@/components/home/Homepage";

// The public website owns "/". The Admin dashboard lives at "/admin".
export default function Home() {
  return (
    <PublicShell>
      <Homepage />
    </PublicShell>
  );
}
