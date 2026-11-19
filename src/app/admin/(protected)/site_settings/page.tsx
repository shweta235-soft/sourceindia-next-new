import AdminSettings from "@/components/admin/AdminSettings";
import { siteSections } from "@/lib/adminSiteSettings";

export default function SiteSettingsPage() {
  return <AdminSettings heading="Site Settings" title="Site Setting" sidebar="Site Settings"
    endpoint="/admin/site-settings-data" sections={siteSections} site />;
}
