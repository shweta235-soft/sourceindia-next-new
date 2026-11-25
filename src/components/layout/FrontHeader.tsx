"use client";
import Link from "next/link";import {usePathname,useRouter,useSearchParams} from "next/navigation";import {useEffect,useState,type FormEvent} from "react";
import {useAuth} from "@/context/AuthContext";import {useSiteSettings,type MenuItem} from "@/context/SiteSettingsContext";import {assetUrl} from "@/lib/asset";import {apiFetch} from "@/lib/api";
type Suggestion={name:string;url?:string};
export default function FrontHeader(){const router=useRouter(),pathname=usePathname(),params=useSearchParams();const {isLoggedIn,user,logout}=useAuth();const [authHydrated,setAuthHydrated]=useState(false);useEffect(()=>{setAuthHydrated(true)},[]);const showLoggedIn=authHydrated&&isLoggedIn;
 const [adminAuthenticated,setAdminAuthenticated]=useState(false);
 const [adminLogoutError,setAdminLogoutError]=useState(false);
 const [adminLoggingOut,setAdminLoggingOut]=useState(false);
 useEffect(()=>{
  if(showLoggedIn){setAdminAuthenticated(false);return;}
  const controller=new AbortController();
  fetch("/admin/session-status",{credentials:"same-origin",cache:"no-store",signal:controller.signal})
   .then(response=>response.ok?response.json():null)
   .then(data=>{if(!controller.signal.aborted)setAdminAuthenticated(data?.authenticated===true)})
   .catch(()=>{if(!controller.signal.aborted)setAdminAuthenticated(false)});
  return ()=>controller.abort();
 },[pathname,showLoggedIn]);
 async function logoutAdmin(){
  if(adminLoggingOut)return;
  setAdminLoggingOut(true);setAdminLogoutError(false);
  try{
   const response=await fetch("/api/admin-session",{method:"DELETE",credentials:"same-origin"});
   if(!response.ok)throw new Error("Admin logout failed");
   setAdminAuthenticated(false);setProfileOpen(false);
   window.location.assign("/admin/login");
  }catch{setAdminLogoutError(true);setAdminLoggingOut(false)}
 }
const {siteSettings}=useSiteSettings();const [openMenuId,setOpenMenuId]=useState<string|number|null>(null);const [type,setType]=useState("product"),[query,setQuery]=useState(""),[focused,setFocused]=useState(false),[suggestions,setSuggestions]=useState<Suggestion[]>([]),[mobileOpen,setMobileOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false);
 useEffect(()=>{setQuery(params.get("search")??"")},[params]);
 useEffect(()=>{setOpenMenuId(null);setMobileOpen(false);setProfileOpen(false)},[pathname]);
 useEffect(()=>{if(!focused||!query.trim()){setSuggestions([]);return}let cancelled=false;const t=setTimeout(()=>{apiFetch<Suggestion[]>(`/front_menu/main-search?q=${encodeURIComponent(query.trim())}&type=${type}`,{method:"POST"}).then(v=>{if(!cancelled)setSuggestions(Array.isArray(v)?v:[])}).catch(()=>{if(!cancelled)setSuggestions([])})},300);return()=>{cancelled=true;clearTimeout(t)}},[focused,query,type]);
 const submit=(e:FormEvent)=>{e.preventDefault();const q=query.trim().replace(/\s+/g," ");if(q.length<3){alert("Enter Product / Service Keyword(s) at least three characters");return}const exact=type==="product"?suggestions.find(s=>s.name.toLowerCase()===q.toLowerCase()&&s.url):undefined;setFocused(false);router.push(exact?`${exact.url}${exact.url!.includes("?")?"&":"?"}search=${encodeURIComponent(q)}`:`${type==="product"?"/products":type==="seller"?"/company-list":"/buyer-list"}?search=${encodeURIComponent(q)}`)};
 const menus=(siteSettings?.front_menu??[]).filter(m=>m.parent_id===0&&m.type!==2);
 return <header className="mainHeader">
 <div className="container-xxl"><div className="top-bar px-xl-3 py-1 d-flex justify-content-between align-items-center">
  <div className="welcomeBox d-lg-flex d-block"><span className="text-nowrap">{showLoggedIn&&user?<>Welcome <b className="text-orange">{user.is_seller?"Seller":"Buyer"}</b>!</>:adminAuthenticated?<>Welcome <b className="text-orange">Admin</b>!</>:"Welcome to Source India Portal"}</span><div className="text-center text-md-start d-none d-md-block"><span className="ms-xl-3 text-nowrap">Support: {siteSettings?.mobile??"+91-11-41615985"}</span></div></div>
  {pathname!=="/"&&<div className="middleBox"><form onSubmit={submit} className="d-flex align-items-center flex-grow-1 position-relative w-100"><div className="search-bar-front d-flex w-100"><select className="form-select w-auto px-3" value={type} onChange={e=>setType(e.target.value)}><option value="product">Products</option><option value="seller">Seller</option><option value="buyer">Buyer</option></select><input className="form-control" placeholder="Enter product / service to search" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)}/><button className="btn search-btn" type="submit">Search</button>{focused&&suggestions.length>0&&<ul className="search-suggestion-box list-unstyled search-suggestion-box-header">{suggestions.map((item,i)=><li key={i} className="search-suggestion-item" onMouseDown={e=>{e.preventDefault();setQuery(item.name);setFocused(false);if(item.url)router.push(item.url)}}><i className="bx bx-search me-2" aria-hidden="true"/><span>{item.name}</span></li>)}</ul>}</div></form></div>}
  <div className="lastbox"><div className="d-flex align-items-center gap-2"><Link className="thLink text-center me-2 lh-1 d-flex gap-2" href="/contact-us"><i className="lni lni-question-circle d-block"/>Support</Link>{showLoggedIn?<div className="dropdown"><button className="d-flex align-items-center dropdown-toggle btn" type="button" onClick={()=>setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="user-name mb-0">{user?.fname??"Account"}</span></button>{profileOpen&&<div className="dropdown-menu dropdown-menu-end mt-2 show"><Link className="dropdown-item" href="/dashboard" onClick={()=>setProfileOpen(false)}>Dashboard</Link><button className="dropdown-item" onClick={()=>{logout();setProfileOpen(false);router.push("/login")}}>Logout</button></div>}</div>:adminAuthenticated?<div className="dropdown"><button className="d-flex align-items-center dropdown-toggle btn" type="button" aria-expanded={profileOpen} onClick={()=>setProfileOpen(!profileOpen)}><span className="user-name mb-0">Admin</span></button>{profileOpen&&<div className="dropdown-menu dropdown-menu-end mt-2 show"><Link className="dropdown-item" href="/admin/dashboard" onClick={()=>setProfileOpen(false)}>Admin Dashboard</Link><button className="dropdown-item" type="button" disabled={adminLoggingOut} onClick={()=>void logoutAdmin()}>{adminLoggingOut?"Signing out…":"Logout"}</button>{adminLogoutError&&<span className="dropdown-item text-danger" role="alert">Logout failed. Try again.</span>}</div>}</div>:<div className="lastboxbtns d-flex flex-sm-row flex-column gap-1"><Link className="btn btn-sm btnType1 text-nowrap" href="/login">Sign In</Link><Link className="btn btn-sm btn-primary text-nowrap" href="/registration">Join Free</Link></div>}</div></div>
 </div></div>
 <div className="bg-white py-0"><div className="container-xxl"><nav className="navbar navbar-expand-lg py-0">
 <Link href="/" className="navbar-brand"><img src={assetUrl(siteSettings?.logo_file,"/logo.png")} alt="Site Logo" height={80} className="me-2" style={{width:"auto"}} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/logo.png"}}/></Link>
 <a href="https://elcina.com" target="_blank" rel="noreferrer" className="post-btn d-inline-block ms-auto me-2 order-lg-3">ELCINA Website</a>
 <button className="navbar-toggler border-0 p-0 position-relative" type="button" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(!mobileOpen)}><span className="bx bx-menu fs-1"/></button>
 <div className={`${mobileOpen?"show":""} collapse navbar-collapse px-3 py-2 rounded-2 centerMenu`} id="mainNavbar"><ul className="navbar-nav mx-auto mt-0">{menus.filter(m=>Number(m.is_show)===1&&Number(m.status)===1&&Number(m.type)===1).map((m:MenuItem)=><li className={`nav-item ${m.sub_menu?.length?"dropdown":""} ${openMenuId===m.id?"show":""}`} key={m.id}>{m.sub_menu?.length?<><button className="nav-link dropdown-toggle btn border-0" type="button" aria-expanded={openMenuId===m.id} onClick={()=>setOpenMenuId(openMenuId===m.id?null:m.id)}>{m.name}</button><ul className={`dropdown-menu ${openMenuId===m.id?"show":""}`}>{m.sub_menu.map(sub=><li key={sub.id}><Link className="dropdown-item" href={sub.link||"/"} onClick={()=>{setOpenMenuId(null);setMobileOpen(false)}}>{sub.name}</Link></li>)}</ul></>:<Link className={`nav-link ${pathname===m.link?"active":""}`} href={m.link||"/"} onClick={()=>{setOpenMenuId(null);setMobileOpen(false)}}>{m.name}</Link>}</li>)}</ul><a className="nav-link" href="https://www.meity.gov.in/" target="_blank" rel="noreferrer"><img src="/icon1.svg" className="img-fluid sourcesatya" alt="Source India" style={{width:150}}/></a></div>
 </nav></div></div></header>;
}
