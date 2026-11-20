"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { assetUrl } from "@/lib/asset";
import { canBrowseOpenEnquiries, canReadConnects, canReadOwnOpenEnquiries } from "@/lib/accountEnquiryDirectory";
import { canReadLeadChat, canReadLeads } from "@/lib/accountLeadInbox";
import { canManageSellerProducts } from "@/lib/sellerProducts";
import { accountFlag } from "@/lib/userDashboard";
import UserHeader from "../layout/UserHeader";
import UserFooter from "../layout/UserFooter";
import styles from "./account.module.css";

export default function AccountShell({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, loadingUser } = useAuth();
  const { siteSettings } = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!loadingUser && !isLoggedIn) {
      const allOpenEnquiries = pathname.startsWith("/open-enquiry/") && new URLSearchParams(window.location.search).get("type") === "1";
      const target = allOpenEnquiries ? `${pathname}?type=1` : pathname;
      router.replace(`/login?returnTo=${encodeURIComponent(target)}`);
    }
  }, [isLoggedIn, loadingUser, pathname, router]);

  if (loadingUser || !isLoggedIn) return <main className="container py-5" role="status">
    {loadingUser ? "Loading…" : "Redirecting to sign in…"}
  </main>;
  if (!user) return <main className="container py-5">
    <p role="alert">Your profile could not be loaded.</p>
    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
  </main>;

  const seller = accountFlag(user.is_seller);
  const admin = Number(user.member_role) === 1;
  const complete = accountFlag(user.is_complete) && accountFlag(user.is_approve);
  const products = canManageSellerProducts(user);
  const menu = [
    { label: seller ? "Seller Dashboard" : "Buyer Dashboard", href: "/dashboard", icon: "bx-home-circle", ready: true },
    { label: "Profile", href: "/profile", icon: "bx-user", ready: true },
    { label: "Add Product/Service", href: "/add_product", icon: "bx-comment-add", ready: true, hidden: !products },
    { label: "My Products", href: "/my-product", icon: "bx-devices", ready: true, hidden: !products },
    { label: "Leads", href: "/seller_enquiry", icon: "bx-user", ready: true, hidden: !canReadLeads(user) },
    { label: "Lead Chats", href: "/all-leads-chats", icon: "bx-chat", ready: true, hidden: !canReadLeadChat(user, false) },
    { label: "My Enquiries", href: "/my_enquiry", icon: "bx-folder", ready: true, hidden: !(admin && complete) },
    { label: "Enquiry Chats", href: "/my-all-enquiries-chats", icon: "bx-chat", ready: true, hidden: !canReadLeadChat(user, true) },
    { label: "Open Enquiries", href: "/open-enquiry-dashboard", icon: "bx-folder-open", ready: true, hidden: !canBrowseOpenEnquiries(user) },
    { label: "My Open Enquiries", href: "/my-open-enquiry-dashboard", icon: "bx-list-ul", ready: true, hidden: !canReadOwnOpenEnquiries(user) },
    { label: seller ? "Buyer Connects" : "Seller Connects", href: "/my-buyer-enquiries", icon: "bx-message-square-dots", ready: true, hidden: !canReadConnects(user) },
    { label: "Add Open Enquiries", href: "/enquiry", icon: "bx-plus", ready: true },
  ];

  return <div className={styles.shell}>
    <aside id="account-sidebar" className={`${styles.sidebar} ${mobileOpen ? styles.sidebarVisible : ""}`}>
      <div className={styles.brand}>
        <Link href="/" aria-label="SourceIndia Home">
          <img src={assetUrl(siteSettings?.logo_file, "/logo.png")} alt="SourceIndia" onError={(event) => {
            if (!event.currentTarget.src.endsWith("/logo.png")) event.currentTarget.src = "/logo.png";
          }} />
        </Link>
        <button type="button" className={`btn ${styles.mobileToggle}`} aria-label="Close account menu" onClick={() => setMobileOpen(false)}>
          <i className="bx bx-arrow-to-left" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Account navigation">
        <ul className={styles.menu}>
          {menu.filter((item) => !item.hidden).map(({ label, href, icon, ready }) => {
            const item = <><span className={styles.menuIcon}><i className={`bx ${icon}`} aria-hidden="true" /></span><span>{label}</span></>;
            return <li key={href}>{ready ? <Link href={href} aria-current={href === pathname || (href === "/my-product" && pathname.startsWith("/edit_product/")) || (href === "/profile" && ["/profile-edit", "/company-edit"].includes(pathname)) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}>{item}</Link> :
              <span className={styles.pending} aria-disabled="true">{item}</span>}</li>;
          })}
        </ul>
      </nav>
    </aside>
    {mobileOpen && <button type="button" className={styles.overlay} aria-label="Close account navigation" onClick={() => setMobileOpen(false)} />}
    <div className={styles.body}>
      <UserHeader menuOpen={mobileOpen} toggleMenu={() => setMobileOpen(!mobileOpen)} />
      <main className={styles.content}><div className="container">{children}</div></main>
      <UserFooter />
    </div>
  </div>;
}
