"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import { assetUrl } from "@/lib/asset";
export type MenuItem={id:number|string;name:string;link:string;parent_id?:number;type?:number;is_show?:number;status?:number;sub_menu?:MenuItem[]};
export type SiteSettings={logo_file?:string;mobile?:string;favicon_file?:string;front_menu?:MenuItem[];home_settings?:{footer_logo?:string;footer_heading?:string;footershort_description?:string;footer_img_1?:string;footer_img_2?:string;contactphone_1?:string;contactphone_2?:string;contactemail?:string;contactaddress?:string;contact_map_url?:string;facebook_url?:string;twitter_url?:string;linkedin_url?:string;youtube_url?:string;instagram_url?:string};[key:string]:unknown};
const Context = createContext<{ siteSettings: SiteSettings | null; loading: boolean }>({ siteSettings: null, loading: true });

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const settings: SiteSettings = await response.json();
        if (controller.signal.aborted) return;
        setSiteSettings(settings);
        if (settings.favicon_file) {
          const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (favicon) favicon.href = assetUrl(settings.favicon_file, "/favicon.png");
        }
      } catch (error) {
        if (!controller.signal.aborted) console.warn("Site settings could not be loaded.", error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSettings();
    return () => controller.abort();
  }, []);

  return <Context.Provider value={{ siteSettings, loading }}>{children}</Context.Provider>;
}

export const useSiteSettings = () => useContext(Context);
