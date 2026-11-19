import AdminSettings from "./AdminSettings";
import { homeSections } from "@/lib/adminHomeSettings";

export default function AdminHomeSettings() {
  return <AdminSettings heading="Home Settings" title="Home Setting" sidebar="About Settings"
    endpoint="/admin/home-settings-data" sections={homeSections} />;
}
