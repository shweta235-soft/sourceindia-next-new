"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { adminMenu, originalAdminIcons } from "./menu";
import styles from "./admin.module.css";
export default function AdminShell({children, expires}:{children:React.ReactNode; expires:number}) {
 const path=usePathname(); const [open,setOpen]=useState(false);
 const [shortcuts,setShortcuts]=useState<Array<{id?:string|number;name:string;link?:string}>>([]);
 const [shortcutLoading,setShortcutLoading]=useState(true);
 const [search,setSearch]=useState("");
 const [expandedGroup,setExpandedGroup]=useState<string|null>(null);
 const [signingOut,setSigningOut]=useState(false);
 const [signOutError,setSignOutError]=useState(false);
 useEffect(() => {
   const checkExpiry = () => {
     if (Date.now() >= expires * 1000) {
       const returnTo = window.location.pathname + window.location.search;
       window.location.replace(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
     }
   };
   const timer = window.setTimeout(checkExpiry, Math.max(0, expires * 1000 - Date.now()));
   window.addEventListener("pageshow", checkExpiry);
   return () => { window.clearTimeout(timer); window.removeEventListener("pageshow", checkExpiry); };
 }, [expires]);
 async function signOut() {
   if (signingOut) return;
   setSigningOut(true);
   setSignOutError(false);
   try {
     const response = await fetch("/api/admin-session", { method: "DELETE" });
     if (!response.ok) throw new Error("Logout failed");
     window.location.replace("/admin/login");
   } catch {
     setSignOutError(true);
     setSigningOut(false);
   }
 }

 useEffect(()=>{let mounted=true;apiFetch<unknown>("shortcut/shortcut_menus?status=1").then(data=>{
   if(mounted)setShortcuts(Array.isArray(data)?data.filter((x):x is {id?:string|number;name:string;link?:string}=>typeof x==="object"&&x!==null&&"name" in x&&typeof (x as {name:unknown}).name==="string"):[]);
 }).catch(()=>{if(mounted)setShortcuts([])}).finally(()=>{if(mounted)setShortcutLoading(false)});return ()=>{mounted=false};},[]);
 return <div className={styles.shell}>
  <aside className={`${styles.sidebar} ${open?styles.visible:""}`}>
   <Link href="/admin/dashboard" className={styles.brand}><img src="/logo.png" alt="SourceIndia Portal" className={styles.brandLogo}/></Link>
   <nav aria-label="Admin navigation" className={styles.sideNav}>{adminMenu.map((group,index)=>{
     const selected=group.links.some(link=>link.href===path || (path==="/admin/dashboard"&&link.href==="/admin") || (path==="/admin/deleted_buyers"&&link.href==="/admin/removed_buyers") || (path==="/admin/deleted_sellers"&&link.href==="/admin/removed_sellers"));
     const iconClass=originalAdminIcons[group.title] || "bx bx-grid-alt";
     if(group.links.length===1&&group.links[0].href==="/admin")return <Link key={group.title} className={`${styles.navHeading} ${selected?styles.active:""}`} href="/admin/dashboard" onClick={()=>setOpen(false)}><i className={iconClass}/><span>{group.title}</span></Link>;
     return <details key={`${group.title}-${index}`} open={expandedGroup===group.title || (expandedGroup===null && selected)} onToggle={e=>{if(e.currentTarget.open)setExpandedGroup(group.title);else if(expandedGroup===group.title)setExpandedGroup("");}} className={styles.navGroup}><summary className={styles.navHeading}><i className={iconClass}/><span>{group.title}</span><i className={`bx bx-chevron-down ${styles.chevron}`}/></summary><div className={styles.subLinks}>{group.links.map(link=><Link className={(path===link.href || (path==="/admin/deleted_buyers"&&link.href==="/admin/removed_buyers") || (path==="/admin/deleted_sellers"&&link.href==="/admin/removed_sellers"))?styles.active:""} href={link.href} key={link.href} onClick={()=>setOpen(false)}>{link.title}</Link>)}</div></details>;
   })}</nav>
  </aside>
  {open&&<button className={styles.overlay} aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
  <div className={styles.main}>
   <header className={styles.header}>
    <button type="button" className={styles.menuToggle} onClick={()=>setOpen(!open)} aria-label="Toggle admin menu"><i className="bx bx-menu"/></button>
    <div className={styles.searchBox}><input aria-label="Search admin" placeholder="Type to search..." value={search} onChange={e=>setSearch(e.target.value)}/><i className="bx bx-search"/>{search&&<button type="button" aria-label="Clear search" className={styles.searchClear} onClick={()=>setSearch("")}><i className="bx bx-x"/></button>}</div>
    <div className={styles.headerRight}>
     <details className={styles.dropdown}><summary aria-label="Shortcuts"><i className="bx bx-grid-alt"/></summary><div className={styles.dropdownMenu}>{shortcutLoading?<span>Loading...</span>:shortcuts.length?shortcuts.map((item,i)=><Link key={item.id??i} href={item.link?.startsWith("/admin")?item.link:"/admin"}><span className={styles.shortcutText}><strong>{item.name}</strong><small>{item.name}</small></span><i className="bx bx-last-page"/></Link>):<span>No shortcuts found</span>}</div></details>
     <details className={styles.dropdown}><summary className={styles.userToggle}><img src="/user.png" alt="Admin avatar"/><span>Admin</span><i className="bx bx-chevron-down"/></summary><div className={styles.dropdownMenu}><Link href="/admin/site_settings"><i className="bx bx-cog"/> Settings</Link><Link href="/admin/dashboard"><i className="bx bx-home-circle"/> Dashboard</Link><button type="button" className={styles.logout} disabled={signingOut} onClick={() => void signOut()}><i className="bx bx-log-out-circle"/> {signingOut ? "Signing out…" : "Logout"}</button>{signOutError && <span role="alert">Logout failed. Please try again.</span>}</div></details>
    </div>
   </header>
   <main className={styles.content}>{children}</main>
  </div>
 </div>;
}
