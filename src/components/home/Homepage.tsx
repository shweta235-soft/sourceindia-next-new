"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {useSiteSettings} from "@/context/SiteSettingsContext";
import TrendingShowcase from "./TrendingShowcase";
import LatestProductSlider from "./LatestProductSlider";
import {assetUrl} from "@/lib/asset";

type Row = Record<string,any>;
const image=(path:any)=>assetUrl(path == null ? null : String(path));
function Photo({src,alt,...props}:{src:any;alt:string;className?:string;style?:React.CSSProperties;width?:number;height?:number}){return <img src={image(src)} alt={alt} loading="lazy" decoding="async" onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}} {...props}/>;}
function useData<T>(path:string,extract:(v:any)=>T,empty:T){const [data,setData]=useState<T>(empty);const [error,setError]=useState(false);useEffect(()=>{let active=true;apiFetch<any>(path).then(v=>{if(active)setData(extract(v))}).catch(()=>{if(active)setError(true)});return()=>{active=false}},[path]);return {data,error};}
const arr=(v:any):Row[]=>Array.isArray(v)?v:[];
function Popup(){
 const {siteSettings,loading}=useSiteSettings();
 const settings=(siteSettings?.home_settings||{}) as Row;
 const imageFile=String(settings.popup_banner_file||"");
 const popupUrl=String(settings.popup_banner_url||"").trim();
 const sessionId=String(settings.popup_banner_session_id||"");
 const enabled=String(settings.popup_banner_status||"0")==="1";
 const [show,setShow]=useState(false);
 useEffect(()=>{
  if(loading)return;
  if(!enabled||!imageFile){setShow(false);return;}
  const key="sourceindia_home_popup_banner";
  try{
   const raw=localStorage.getItem(key);
   if(!raw){setShow(true);return;}
   const old=JSON.parse(raw);
   const storedId=String(old?.sessionId||"");
   if(storedId&&sessionId&&storedId!==sessionId){localStorage.removeItem(key);setShow(true);return;}
   setShow(!(Boolean(old?.clicked)&&storedId===sessionId));
  }catch{localStorage.removeItem(key);setShow(true);}
 },[loading,enabled,imageFile,sessionId]);
 const handleClick=()=>{
  if(sessionId)localStorage.setItem("sourceindia_home_popup_banner",JSON.stringify({sessionId,clicked:true,isCancled:false}));
  if(popupUrl)window.location.href=popupUrl;
  else setShow(false);
 };
 if(!show)return null;
 return <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex:1060,backgroundColor:"rgba(0,0,0,.65)"}}>
  <div className="position-relative bg-white rounded shadow overflow-hidden" style={{maxWidth:520,width:"90%"}}>
   <button type="button" className="border-0 position-absolute top-0 end-0 m-2 rounded-circle" style={{zIndex:1}} onClick={()=>setShow(false)} aria-label="Close popup"><i className="bx bx-x fs-5"/></button>
   <button type="button" onClick={handleClick} className="w-100 border-0 bg-transparent p-0"><Photo src={imageFile} alt="Popup Banner" className="img-fluid w-100"/></button>
  </div>
 </div>;
}
function Banner(){const {data}=useData("/home_banners",v=>arr(v).filter(x=>Number(x.status)===1&&Number(x.is_delete)===0),[] as Row[]);const [index,setIndex]=useState(0);const [q,setQ]=useState("");const [type,setType]=useState("product");const [suggestions,setSuggestions]=useState<Row[]>([]);const [searchFocused,setSearchFocused]=useState(false);useEffect(()=>{if(!searchFocused||q.trim().length<3){setSuggestions([]);return}let cancelled=false;const t=setTimeout(()=>apiFetch<Row[]>(`/front_menu/main-search?q=${encodeURIComponent(q.trim())}&type=${type}`,{method:"POST"}).then(v=>{if(!cancelled)setSuggestions(arr(v))}).catch(()=>{if(!cancelled)setSuggestions([])}),300);return()=>{cancelled=true;clearTimeout(t)}},[q,type,searchFocused]);useEffect(()=>{if(data.length<2)return;const t=setInterval(()=>setIndex(i=>(i+1)%data.length),5000);return()=>clearInterval(t)},[data.length]);const route=type==="product"?"/products":type==="seller"?"/company-list":"/buyer-list";const active=data[index%Math.max(data.length,1)]||{};
const first=data[0]||{};
const bannerImageUrl=first.file_name?image(first.file_name):"";
const [backgroundReady,setBackgroundReady]=useState(false);
useEffect(()=>{
  if(!bannerImageUrl){setBackgroundReady(true);return;}
  let cancelled=false;
  setBackgroundReady(false);
  const preload=new Image();
  preload.onload=()=>{if(!cancelled)setBackgroundReady(true)};
  preload.onerror=()=>{if(!cancelled)setBackgroundReady(true)};
  preload.src=bannerImageUrl;
  return ()=>{cancelled=true;preload.onload=null;preload.onerror=null};
},[bannerImageUrl]);
const popular=String(first.popular_searches||"PCB,Capacitor,Connectors,IC,Power Supply,Resistors,LED,Sensors").split(/[,;]/).map(x=>x.trim()).filter(Boolean);
return <><div className="mainBanner container-xxl"><div className="bgCarouselImg mt-2"><div className="banner-slide" style={{backgroundImage:backgroundReady&&bannerImageUrl?`url("${bannerImageUrl}")`:"none",backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:"cover",borderRadius:15}}>
<div className="banner-overlay"/><div className=""><div className="rowleftBox align-items-center">
<div className="innerrowleftBox"><div id="carouselExampleCaptions" className="carousel slide"><div className="carousel-inner">{(data.length?data:[{}]).map((slide,slideIndex)=><div className={`carousel-item ${slideIndex===index%Math.max(data.length,1)?"active":""}`} key={slide.id||slideIndex}><div className="hero-left-card">
<div className="hero-card-header mb-3"><span className="hero-slide-counter">{String(index+1).padStart(2,"0")}/{String(Math.max(data.length,1)).padStart(2,"0")}</span></div>
<h2 className="hero-left-main"><span className="hero-left-normal">{slideIndex===0?"BUY & SOURCE PRODUCTS":"LIST & SELL PRODUCTS"}</span></h2>
<p className="hero-left-desc mb-3 w-75">{slideIndex===0?"Share your requirements and connect with the right sellers.":"List your products and connect with verified buyers across India."}</p>
<ul className="hero-feature-list">{String(slide.description||"Create Your Business Profile<br>Add Products in Few Clicks<br>Receive Enquiries & Grow Business").split(/<br\s*\/?>|\n|\r/).map(x=>x.replace(/<[^>]*>/g,"").trim()).filter(Boolean).map((f,i)=><li key={i}>{f}</li>)}</ul>
<div className="d-flex flex-wrap gap-2 mt-4"><a className="btn btn-primary btn-lg hero-cta" href={slide.button_url||"/registration"} target={slide.button_url?"_blank":"_self"} rel={slide.button_url?"noreferrer":undefined}>{slide.button_text||"Join as Seller"}</a></div>
{data.length>1&&<div className="hero-slider-dots mt-4">{data.map((_,i)=><button type="button" key={i} onClick={()=>setIndex(i)} className={`slider-dot ${i===index?"active":""}`} aria-label={`Banner ${i+1}`}/>)}</div>}
</div></div>)}</div></div></div>
<div className="innerrowleftBoxlong position-relative"><div className="hero-search-card"><div className="hero-search-header"><h1>{first.title||"Search Electronics Products"}</h1><p className="hero-subtitle">{first.sub_title||"Find high quality products, manufacturers, suppliers and service providers"}</p></div>
<form className="hero-search-form" onSubmit={e=>{e.preventDefault();if(q.trim().length<3){alert("Enter Product / Service Keyword(s) at least three characters");return}window.location.href=`${route}?search=${encodeURIComponent(q.trim())}`}}><div className="popularPartbox">
<select aria-label="Search type" className="form-select form-select-lg" value={type} onChange={e=>setType(e.target.value)}><option value="product">Products</option><option value="seller">Seller</option><option value="buyer">Buyer</option></select>
<div className="flex-grow-1 search-input-wrap"><input className="form-control form-control-lg" value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setTimeout(()=>setSearchFocused(false),150)} placeholder="Enter product / service name to search"/>{searchFocused&&suggestions.length>0&&<ul className="search-suggestion-box list-unstyled shadow-sm">{suggestions.slice(0,8).map((v,i)=><li className="search-suggestion-item" key={i} onMouseDown={e=>{e.preventDefault();if(v.url)window.location.href=`${v.url}${String(v.url).includes("?")?"&":"?"}search=${encodeURIComponent(v.name||q)}`}}><span className="suggestion-row"><span className="search-suggestion-icon"><i className="bx bx-history"/></span><span className="search-suggestion-content"><span className="search-suggestion-title">{v.name||v.title}</span></span></span></li>)}<li className="search-suggestion-footer"><button type="button" className="search-suggestion-viewall" onMouseDown={e=>{e.preventDefault();const normalized=q.replace(/\s+/g," ").trim();if(normalized.length<3){alert("Enter Product / Service Keyword(s) at least three characters");return}window.location.href=`${route}?search=${encodeURIComponent(normalized)}`}}><i className="bx bx-search"/><span>View all results for &quot;{q.replace(/\s+/g," ").trim()}&quot;</span></button></li></ul>}</div>
<button className="btn btn-primary btn-lg search-btn" type="submit">Search</button></div></form>
<div className="popular-searches mt-4"><strong>Popular Searches:</strong><div className="popular-search-list mt-2">{popular.map((x,i)=><button className="btn btn-sm btn-search-chip" key={i} onClick={()=>{window.location.href=`/products?search=${encodeURIComponent(x)}`}}>{x}</button>)}</div></div>
</div></div></div></div></div></div>
<TrendingShowcase/></div></>}

function LatestProducts(){const {data,error}=useData("/products/latest-home",v=>arr(v?.products),[] as Row[]);return <section className="productSection py-md-4 py-3 mb-4"><div className="container-xxl"><div className="firstHead text-center pb-md-5 pb-4"><h1 className="mb-0">Latest Product</h1></div>{error&&<p role="status">Latest products could not be loaded.</p>}<div className="productGrid"><div className="row">{data.map((p,i)=><div className="col-lg-4 col-sm-6 col-12 mb-4" key={p.id||i}><div className="productBox p-3 bg-white"><div className="cateproduct"><p>{p.category_name}</p></div><div className="middlepro"><div className="ProImg"><Photo src={p.file_name} alt={p.title||"Product"}/></div><div className="productlink"><p className="mb-0">{p.title}</p><Link href={`/products/${p.slug}`} className="d-inline-block pt-2"><span className="pe-2">View</span><svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" aria-hidden="true"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"/></svg></Link></div></div></div></div>)}</div></div></div></section>}
function Categories(){
 const {data,error}=useData("/categories/category-item?is_delete=0&status=1&limit=6&is_home=1",arr,[] as Row[]);
 const [products,setProducts]=useState<Record<string,Row[]>>({});
 useEffect(()=>{let active=true;for(const cat of data){apiFetch<any>(`/products?category=${encodeURIComponent(String(cat.id))}&is_delete=0&status=1&is_approve=1&is_front=1&limit=10&sort_by=newest`).then(v=>{if(active)setProducts(prev=>({...prev,[String(cat.id)]:arr(v?.products)}))}).catch(()=>{});}return()=>{active=false}},[data]);
 return <div className="si-category-sections">{error&&<p className="container-xxl" role="status">Categories could not be loaded.</p>}{data.map((cat,i)=>{
 const subs=arr(cat.subcategories).filter(sub=>Number(sub.product_count||0)>0).slice(0,6);
 return <section className="categorySection py-md-4 pt-2 my-4" key={cat.id||i}><div className="container-xxl"><div className="categoryMainBox"><div className="categoryMainHeader"><h4 className="categoryMainTitle">{cat.name}</h4><span className="categoryMainAccent"/></div><div className="categoryMainBody"><div className="categoryPromoCard"><Photo src={cat.file_name} alt={cat.name||"Category"} className="categoryPromoImage"/><div className="categoryPromoOverlay"/><div className="categoryPromoContent"><Link href={`/categories/${cat.slug}`} className="categoryPromoBtn"><span>Explore {cat.name}</span><span className="categoryPromoBtnArrow">→</span></Link></div></div><div className="subcategoryGrid">{subs.length?subs.map((sub,j)=><div className="subcategoryCard" key={sub.id||j}><div className="subcategoryCardHeader"><Link className="subcategoryCardTitleLink" href={`/categories/${cat.slug}/${sub.slug}`}><h6 className="subcategoryCardTitle">{sub.name}</h6></Link><Link className="subcategoryArrow" href={`/categories/${cat.slug}/${sub.slug}`}>→</Link></div><div className="subcategoryCardContent"><ul className="categoryItemList">{arr(sub.item_categories).filter(item=>Number(item.product_count||0)>0).slice(0,4).map((item,k)=><li key={item.id||k}><Link href={`/products?category_id=${cat.id}&subcategory_id=${sub.id}&item_category_id=${item.id}`}>{String(item.name||"").length>20?`${String(item.name).slice(0,20)}...`:item.name}</Link></li>)}</ul>{sub.file_name&&<div className="subcategoryThumb"><Photo src={sub.file_name} alt={sub.name||"Subcategory"}/></div>}</div><Link className="subcategoryViewAll" href={`/categories/${cat.slug}/${sub.slug}`}>View all →</Link></div>):<p className="subcategoryEmpty">No subcategories found.</p>}</div></div><LatestProductSlider products={products[String(cat.id)]||[]} categoryName={String(cat.name||"")}/></div></div></section>})}</div>
}
function Companies(){const {data,error}=useData("/products/companies?is_delete=0&limit=11&page=1",v=>arr(Array.isArray(v)?v:v?.data||v?.companies),[] as Row[]);return <section className="companySection py-md-4 pt-2 pb-3 mb-4"><div className="container-xxl"><div className="firstHead text-center pb-md-5"><h1 className="mb-0">FEATURED COMPANIES</h1></div>{error&&<p role="status">Featured companies could not be loaded.</p>}<div className="companyGrid"><div className="row gx-3">{data.map((c,i)=><div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3" key={c.id||i}><Link href={`/companies/${c.organization_slug}`} className="d-block h-100"><div className="companyBox px-3 py-4 bg-white border h-100 text-center"><div className="ComImg"><Photo src={c.company_logo_file} alt={c.organization_name||"Company"} className="img-fluid" width={180} height={180}/></div><p className="mb-0"><small>{c.organization_name}</small></p></div></Link></div>)}<div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3"><Link href="/companies" className="d-block h-100"><div className="companyBox px-3 py-4 bg-white border text-center h-100"><div className="ComImg"><img src="/morecompany.jpg" alt="More companies" className="img-fluid p-3" loading="lazy" decoding="async"/><p>More Companies</p></div></div></Link></div></div></div></div></section>}
export default function Homepage(){return <><Popup/><Banner/><LatestProducts/><Categories/><Companies/></>}
