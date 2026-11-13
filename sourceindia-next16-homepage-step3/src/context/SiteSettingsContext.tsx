"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {apiFetch} from "@/lib/api";
export type MenuItem={id:number|string;name:string;link:string;parent_id?:number;type?:number;sub_menu?:MenuItem[]};
export type SiteSettings={logo_file?:string;mobile?:string;favicon_file?:string;front_menu?:MenuItem[];home_settings?:{footer_logo?:string;footer_heading?:string;footershort_description?:string;footer_img_1?:string;footer_img_2?:string};[key:string]:unknown};
const Context=createContext<{siteSettings:SiteSettings|null;loading:boolean}>({siteSettings:null,loading:true});
export function SiteSettingsProvider({children}:{children:ReactNode}){const [siteSettings,setSiteSettings]=useState<SiteSettings|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;apiFetch<SiteSettings>("/settings/front-site").then(s=>{if(!active)return;setSiteSettings(s);if(s.favicon_file){const el=document.querySelector<HTMLLinkElement>("link[rel='icon']");if(el)el.href=s.favicon_file}}).catch(e=>console.error("Site settings request failed",e)).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 return <Context.Provider value={{siteSettings,loading}}>{children}</Context.Provider>}
export const useSiteSettings=()=>useContext(Context);
