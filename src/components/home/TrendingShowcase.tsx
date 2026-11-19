"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
import {useSiteSettings} from "@/context/SiteSettingsContext";
type Item=Record<string,any>;
const array=(x:any):Item[]=>Array.isArray(x)?x:[];
const unique=(list:Item[])=>{const seen=new Set<string>();return list.filter(x=>{const key=String(x.name||"").toLowerCase().trim();if(seen.has(key))return false;seen.add(key);return true})};
const seededShuffle=(list:Item[],seedText:string)=>{const arr=[...list];let seed=0;for(let i=0;i<seedText.length;i++)seed=(seed*31+seedText.charCodeAt(i))>>>0;const random=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
const productUrl=(x:Item)=>`/products?category_id=${x.category_id}&subcategory_id=${x.subcategory_id}&item_category_id=${x.item_category_id}&item_subcategory_id=${x.id}`;
export default function TrendingShowcase(){
 const {siteSettings,loading:siteSettingsLoading}=useSiteSettings();
 const [cats,setCats]=useState<Item[]>([]);const [loading,setLoading]=useState(true);const [open,setOpen]=useState<number|null>(null);const [openAll,setOpenAll]=useState(false);
 useEffect(()=>{let cancelled=false;(async()=>{try{
 const c=unique(array(await apiFetch<any>("/categories?is_delete=0")).filter(x=>Number(x.product_count)>0));
 const ids=c.map(x=>x.id);if(!ids.length)return;
 const [sub,item]=await Promise.all([apiFetch<any>("/sub_categories/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories:ids})}).catch(()=>[]),apiFetch<any>("/item_sub_category").catch(()=>[])]);
 const subs=unique(array(sub).filter(x=>Number(x.product_count)>0));
 const items=unique(array(item).filter(x=>Number(x.product_count)>0&&Number(x.status)===1&&Number(x.is_delete||0)===0&&!/deleted/i.test(String(x.name||""))));
 const nested=c.map(cat=>({...cat,subcategories:subs.filter(x=>Number(x.category)===Number(cat.id)).map(s=>({...s,item_subcategories:items.filter(i=>Number(i.subcategory_id)===Number(s.id)&&Number(i.category_id)===Number(cat.id)&&i.slug&&s.slug&&cat.slug).sort((a,b)=>Number(b.product_count)-Number(a.product_count))}))}));
 if(!cancelled)setCats(nested);
 }catch(e){console.error("Trending categories failed",e)}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[]);
 const trending=useMemo(()=>{
 const allowed=String(siteSettings?.trending_b2b_item_subcategory_ids||"").split(",").map(Number).filter(Boolean);
 const all:Item[]=[];cats.forEach(c=>array(c.subcategories).forEach(sub=>array(sub.item_subcategories).forEach(i=>{if(!allowed.length||allowed.includes(Number(i.id)))all.push({...i,category_id:c.id,item_category_id:i.item_category_id||i.id})})));
 const limit=Math.max(1,Number(siteSettings?.trending_b2b_limit||12)||12);
 const filtered=all.filter(i=>i.file_name||i.file_id||Number(i.product_count)>0);const monthlyRandom=String(siteSettings?.trending_b2b_random_monthly??"1")!=="0";const ordered=monthlyRandom?seededShuffle(filtered,new Date().toISOString().slice(0,7)):[...filtered].sort((a,b)=>Number(b.product_count)-Number(a.product_count)||Number(a.id)-Number(b.id));return ordered.slice(0,limit);
 },[cats,siteSettings]);
 if(loading||siteSettingsLoading)return <section className="homeCategoryShowcase py-md-4 py-5">
  <div className="container-xxl"><div className="browseCategories">
   <div className="sidebar">
    <span className="content-placeholder" style={{display:"block",width:"100%",height:42,borderRadius:0}}/>
    {Array.from({length:8},(_,i)=><div key={i} className="d-flex align-items-center justify-content-between gap-2" style={{padding:"13px 16px",borderBottom:"1px solid #f0f0f0"}}>
      <span className="content-placeholder" style={{width:"55%",height:14}}/>
      <span className="content-placeholder" style={{width:14,height:14}}/>
    </div>)}
   </div>
   <div className="trendingCategories"><div className="_title"><h2>Trending B2B Product Categories</h2></div>
    <div className="tren_list">{Array.from({length:12},(_,i)=><div className="tren_iteam" key={i}>
     <div className="tren_img"><span className="content-placeholder" style={{display:"block",width:"100%",height:"100%"}}/></div>
     <div className="tren_title"><span className="content-placeholder" style={{display:"block",width:"70%",height:13,margin:"0 auto"}}/></div>
    </div>)}</div>
   </div>
  </div></div>
 </section>;
 const showTrending=String(siteSettings?.trending_b2b_enabled??"1")!=="0" && trending.length>0;
 if(!loading && !siteSettingsLoading && cats.length===0 && !showTrending)return null;
 return <section className="homeCategoryShowcase py-md-4 py-5 my-3">
  <div className="">
  <div className="browseCategories">
   {cats.length>0&&<div className="sidebar">
    <div className="bcs-header"><i className="bx bx-menu-alt-left bcs-header-icon"/> Top Categories</div>
    <ul className="mc-list">
     {cats.slice(0,10).map((c,i)=><li className={`mcl-iteam${open===i?" open":""}`} key={c.id||i}>
      <Link href={`/categories/${c.slug}`} className="mcl-iteam-link">
       {c.file_name&&<img className="svg_icon" src={assetUrl(c.file_name)} alt="" width={24} height={24} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>}
       <span className="mcl-iteam-name">{c.name}</span><i className="bx bx-chevron-right mcl-iteam-arrow"/>
      </Link>
      {array(c.subcategories).length>0&&<><button type="button" className="mcl-iteam-toggle" aria-expanded={open===i} aria-label={`Toggle ${c.name} subcategories`} onClick={()=>setOpen(open===i?null:i)}><i className={`bx ${open===i?"bx-chevron-up":"bx-chevron-down"}`}/></button>
       <ul className="mcsc">{array(c.subcategories).map(sub=><li className="mcsc-iteam" key={sub.id}><p className="mcsc-heading"><Link href={`/categories/${c.slug}/${sub.slug}`}>{sub.name}</Link></p><ul className="mcsc-list">{array(sub.item_subcategories).slice(0,5).map(item=><li key={item.id}><Link href={productUrl(item)}>{item.name}</Link></li>)}{array(sub.item_subcategories).length>5&&<li className="mcsc-view-all"><Link href={`/categories/${c.slug}/${sub.slug}`}>View More</Link></li>}</ul></li>)}</ul>
      </>}
     </li>)}
    </ul>
    <div className={`all-cl${openAll?" open":""}`}><div className="all-cl-row"><Link href="/categories" className="all-cl-iteam"><i className="bx bx-grid-alt all-cl-img"/> All Categories</Link><button type="button" className="all-cl-toggle" aria-expanded={openAll} aria-label="Toggle all categories list" onClick={()=>setOpenAll(!openAll)}><i className={`bx ${openAll?"bx-chevron-up":"bx-chevron-down"}`}/></button></div><ul className="all-cl-list">{cats.map(c=><li key={c.id}><Link href={`/categories/${c.slug}`}>{c.name}</Link></li>)}</ul></div>
   </div>}
   {(loading||siteSettingsLoading||showTrending)&&<div className="trendingCategories"><div className="_title"><h2>Trending B2B Product Categories</h2></div><div className="tren_list">
    {((loading||siteSettingsLoading)?Array.from({length:12},(_,i)=>({id:`loading-${i}`,name:"",file_name:null})):trending).map(item=><div className="tren_iteam" key={item.id}><Link href={loading||siteSettingsLoading?"#":productUrl(item)} title={item.name}><div className="tren_img">{loading||siteSettingsLoading?<span className="content-placeholder" style={{display:"block",width:"100%",height:"100%"}}/>:<img src={item.file_name?assetUrl(item.file_name):"/default.png"} alt={item.name} width={200} height={200} loading="lazy" decoding="async" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>}</div><div className="tren_title">{item.name}</div></Link></div>)}
   </div></div>}
   <div className="promotional-banners"><Link href="/registration" className="pbr-banner-link" aria-label="Promotional banner 1"><img src="/img1.png" alt="Promotional banner 1" loading="lazy" decoding="async"/></Link><Link href="/enquiry" className="pbr-banner-link" aria-label="Promotional banner 2"><img src="/img2.png" alt="Promotional banner 2" loading="lazy" decoding="async"/></Link></div>
  </div>
  </div>
 </section>;
}
