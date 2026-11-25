"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { companyListingConnectHref } from "@/lib/companyListingConnect";

type Company = { id?: string | number; organization_slug?: string | null; organization_name?: string | null; company_logo_file?: string | null; city?: string; state?: string; company_location?: string | null; company_website?: string | null; core_activity_name?: string | null; activity_name?: string | null; category_name?: string | null; sub_category_name?: string | null; user?: { address?: string | null; products?: string | null }; products?: {id?: number | string; slug?: string | null; title?: string | null}[]; };
type FilterOption = { id: number; name: string; company_count?: number };
type FilterKey = "category" | "sub_category" | "core_activity" | "activity" | "user_state" | "interest_sub_categories" | "item_category" | "item_subcategory";
const filterEndpoints: Record<FilterKey,string> = {category:"/categories/product-categories?is_delete=0&status=1",sub_category:"",activity:"",core_activity:"/core_activities?is_delete=0&status=1",user_state:"/location/states/101",interest_sub_categories:"/interest_sub_categories/count_relation",item_category:"/item_category/getitem?status=1",item_subcategory:""};
const filterLabels: Record<FilterKey,string> = {category:"Product Category",sub_category:"Sub Category",activity:"Activity",core_activity:"Core Activity",user_state:"State",interest_sub_categories:"Sourcing Interest",item_category:"Item Category",item_subcategory:"Item Type"};
type ApiResult = { companies?: Company[]; total?: number };
type Mode = "seller" | "buyer" | "trading";
const labels: Record<Mode,string> = {seller:"Companies",buyer:"Buyers",trading:"Trading Companies"};
export default function CompanyListingFilter({mode}:{mode:Mode}) {
 const params=useSearchParams();
 const [term,setTerm]=useState(params.get("search")||"");
 const [search,setSearch]=useState(params.get("search")||"");
 const [sort,setSort]=useState("");
 const [viewMode,setViewMode]=useState<"grid"|"list">("grid");
 const [page,setPage]=useState(1);
 const loadSentinel=useRef<HTMLDivElement|null>(null);
 const [items,setItems]=useState<Company[]>([]);
 const [total,setTotal]=useState<number|undefined>();
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [retryCount,setRetryCount]=useState(0);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [options,setOptions]=useState<Partial<Record<FilterKey,FilterOption[]>>>({});
 const [selected,setSelected]=useState<Record<FilterKey,number[]>>({category:params.get("category_id")?[Number(params.get("category_id"))]:[],sub_category:[],core_activity:[],activity:[],user_state:[],interest_sub_categories:[],item_category:[],item_subcategory:[]});
 const [filterSearch,setFilterSearch]=useState<Partial<Record<FilterKey,string>>>({});
 const filterKeys:FilterKey[]=["core_activity","activity","category","sub_category","user_state","interest_sub_categories","item_category","item_subcategory"];
 useEffect(()=>{
  let alive=true;
  filterKeys.filter(key=>key!=="sub_category"&&key!=="activity"&&key!=="item_subcategory").forEach(key=>{apiFetch<FilterOption[]>(filterEndpoints[key]).then(data=>{if(alive)setOptions(prev=>({...prev,[key]:Array.isArray(data)?data.filter(x=>x.company_count===undefined||x.company_count>0):[]}))}).catch(()=>{if(alive)setOptions(prev=>({...prev,[key]:[]}))})});
  return ()=>{alive=false};
 },[]);
 useEffect(()=>{
  let alive=true;
  const categories=selected.category;
  if(!categories.length){setOptions(prev=>({...prev,sub_category:[]}));setSelected(prev=>prev.sub_category.length?{...prev,sub_category:[]}:prev);return;}
  apiFetch<FilterOption[]>("/sub_categories/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories})})
   .then(data=>{if(!alive)return;const opts=Array.isArray(data)?data.filter(x=>x.company_count===undefined||x.company_count>0):[];setOptions(prev=>({...prev,sub_category:opts}));setSelected(prev=>({...prev,sub_category:prev.sub_category.filter(id=>opts.some(o=>o.id===id))}));})
   .catch(()=>{if(alive)setOptions(prev=>({...prev,sub_category:[]}))});
  return ()=>{alive=false};
 },[selected.category.join(",")]);
 useEffect(()=>{
  let alive=true;
  const core=selected.core_activity[0];
  if(!core){setOptions(prev=>({...prev,activity:[]}));setSelected(prev=>prev.activity.length?{...prev,activity:[]}:prev);return;}
  apiFetch<FilterOption[]>(`/activities/coreactivity/${core}`).then(data=>{if(!alive)return;const opts=Array.isArray(data)?data.filter(x=>x.company_count===undefined||x.company_count>0):[];setOptions(prev=>({...prev,activity:opts}));setSelected(prev=>({...prev,activity:prev.activity.filter(id=>opts.some(o=>o.id===id))}));}).catch(()=>{if(alive)setOptions(prev=>({...prev,activity:[]}))});
  return ()=>{alive=false};
 },[selected.core_activity.join(",")]);
 useEffect(()=>{
  let alive=true;
  const category=selected.item_category[0];
  if(!category){setOptions(prev=>({...prev,item_subcategory:[]}));setSelected(prev=>prev.item_subcategory.length?{...prev,item_subcategory:[]}:prev);return;}
  apiFetch<FilterOption[]>(`/item_category/getitemtype/${category}`).then(data=>{if(!alive)return;const opts=Array.isArray(data)?data.filter(x=>x.company_count===undefined||x.company_count>0):[];setOptions(prev=>({...prev,item_subcategory:opts}));setSelected(prev=>({...prev,item_subcategory:prev.item_subcategory.filter(id=>opts.some(o=>o.id===id))}));}).catch(()=>{if(alive)setOptions(prev=>({...prev,item_subcategory:[]}))});
  return ()=>{alive=false};
 },[selected.item_category.join(",")]);
 const filterSignature=JSON.stringify(selected);
 const toggleFilter=(key:FilterKey,id:number)=>{setSelected(prev=>({...prev,[key]:prev[key].includes(id)?prev[key].filter(v=>v!==id):(key==="core_activity"||key==="activity"||key==="item_category"?[id]:[...prev[key],id]),...(key==="core_activity"?{activity:[]}:{}),...(key==="category"?{sub_category:[]}: {}),...(key==="item_category"?{item_subcategory:[]}: {})}));setPage(1)};

 useEffect(()=>{setPage(1);setItems([])},[mode,search,sort,filterSignature]);
 useEffect(()=>{
  let active=true;
  const q=new URLSearchParams({is_delete:"0",status:"1",limit:"12",page:String(page)});
  if(mode==="seller")q.set("is_seller","1");
  if(mode==="buyer")q.set("is_seller","0");
  if(mode==="trading")q.set("is_trading","1");
  if(search)q.set("title",search);
  if(sort)q.set("sort_by",sort);
  filterKeys.forEach(key=>{if(selected[key].length)q.set(key,selected[key].join(","))});
  setLoading(true);setError("");
  apiFetch<ApiResult>(`/products/companies?${q}`).then(data=>{
   if(!active)return;
   const incoming=Array.isArray(data?.companies)?data.companies:[];
   setTotal(typeof data?.total==="number"?data.total:undefined);
   setItems(prev=>page===1?incoming:[...prev,...incoming].filter((c,i,a)=>a.findIndex(v=>String(v.id||v.organization_slug)===String(c.id||c.organization_slug))===i));
  }).catch(()=>{if(active)setError("Companies could not be loaded. Please try again.")}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[mode,page,search,sort,filterSignature,retryCount]);
 const canLoadMore=total!==undefined?items.length<total:items.length>=page*12;
 useEffect(()=>{
  const node=loadSentinel.current;
  if(!node||!canLoadMore||loading||error||items.length===0)return;
  const observer=new IntersectionObserver(entries=>{
   if(entries[0]?.isIntersecting)setPage(current=>current+1);
  },{rootMargin:"180px"});
  observer.observe(node);
  return ()=>observer.disconnect();
 },[canLoadMore,loading,error,items.length]);
 return <main className="container-xxl my-4"><div className="row">
 <div className="col-12 col-lg-3"><button className="btn btn-outline-primary d-lg-none mb-3" onClick={()=>setFiltersOpen(!filtersOpen)}>Filters</button>
 <aside className={`filter-sidebar mb-4 ${filtersOpen?"show":""}`}>
 <div className="d-flex align-items-center justify-content-between mb-3 d-lg-none"><h6 className="mb-0 fw-semibold text-dark">Filters:</h6><button type="button" className="filter-close-btn fs-2 bg-white border-0" onClick={()=>setFiltersOpen(false)} aria-label="Close filters">&times;</button></div>
 <form onSubmit={e=>{e.preventDefault();setSearch(term.trim());setPage(1)}} className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
 <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Company Name</h3>
 <div className="input-group flex-nowrap ps-2 pe-4"><i className="bx bx-search input-group-text" aria-hidden="true"/><input className="form-control" placeholder="Search companies..." value={term} onChange={e=>{setTerm(e.target.value);setSearch(e.target.value);setPage(1)}} aria-label="Search companies"/></div></form>
 {filterKeys.filter(key=>mode==="seller" ? !["interest_sub_categories","item_category","item_subcategory"].includes(key) : mode==="buyer" && ["item_category","item_subcategory"].includes(key)).filter(key=>!(["activity","sub_category"].includes(key) && !(options[key]?.length))).map(key=><section key={key} className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
 <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">{key==="category"?"Category":key==="activity"?"Activitiy":filterLabels[key]}</h3>
 <div className="d-flex flex-column gap-2">{(key==="sub_category"&&!selected.category.length||key==="activity"&&!selected.core_activity.length)&&<p className="text-muted small mb-2">Select {key==="activity"?"Core Activity":"Product Category"} first.</p>}<div className="input-group flex-nowrap ps-2 pe-4"><i className="bx bx-search input-group-text" aria-hidden="true"/><input className="form-control" aria-label={`Search ${filterLabels[key]}`} placeholder={`Search ${key==="category"?"Category":key==="activity"?"Activitiy":filterLabels[key]}...`} value={filterSearch[key]||""} onChange={e=>setFilterSearch(prev=>({...prev,[key]:e.target.value}))}/></div>
 <div className="px-2" style={{maxHeight:190,overflowY:(options[key]||[]).length>=5?"auto":"visible"}}>{(options[key]||[]).filter(opt=>opt.name.toLowerCase().includes((filterSearch[key]||"").toLowerCase())).map(opt=><label key={opt.id} className="form-check mb-2"><input className="form-check-input" type={key==="core_activity"||key==="activity"||key==="item_category"?"radio":"checkbox"} name={key==="item_category"?"itemCategory":key} checked={selected[key].includes(opt.id)} onChange={()=>toggleFilter(key,opt.id)}/><span className="form-check-label text-capitalize">{opt.name}</span>{typeof opt.company_count==="number"&&<small className="text-muted"> ({opt.company_count})</small>}</label>)}</div>
 </div></section>)}
 {filterKeys.some(key=>selected[key].length>0)&&<button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={()=>setSelected({category:[],sub_category:[],core_activity:[],activity:[],user_state:[],interest_sub_categories:[],item_category:[],item_subcategory:[]})}>Clear Filters</button>}
 </aside></div>
 <div className="col-12 col-lg-9">
 <div className="d-sm-flex align-items-center justify-content-between mb-2 primary-color-bg px-3 py-2 rounded-2 text-white gap-2" aria-label="Company sorting and view options">
  <div className="d-flex align-items-center flex-wrap mobileblock"><strong className="text-nowrap me-2">Sort By :</strong>
   <ul className="list-unstyled filterLst d-flex flex-wrap align-items-center mb-0">
    {([{value:"a_to_z",label:"A to Z",icon:"bx-sort-a-z"},{value:"z_to_a",label:"Z to A",icon:"bx-sort-z-a"},{value:"newest",label:"Newest First",icon:"bx-sort"}] as const).map((option,index)=><li key={option.value} className={`sortPopular px-2 ${index===1?"border-start border-end":""}`}><label className={`m-0 cursor-pointer ${sort===option.value?"text-orange fw-bold":""}`}><input className="invisible d-none" type="radio" name="companySort" value={option.value} checked={sort===option.value} onChange={()=>{setSort(option.value);setPage(1)}}/>{option.label}<i className={`bx ${option.icon} ms-1`} aria-hidden="true"/></label></li>)}
   </ul>
  </div>
  <div className="ms-auto d-flex gap-2 align-items-center justify-content-between mobileblock"><p className="mb-0 text-nowrap">{total??items.length} Companies</p>
   <div className="d-lg-flex d-none gap-2 align-items-center"><button type="button" className={`btn btn-sm text-nowrap ${viewMode==="grid"?"btn-orange":"btn-outline-white text-white"}`} style={{padding:"0.188rem 0.625rem"}} aria-pressed={viewMode==="grid"} onClick={()=>setViewMode("grid")}><i className="bx bx-grid-alt me-2" aria-hidden="true"/>Grid View</button><button type="button" className={`btn btn-sm text-nowrap ${viewMode==="list"?"btn-orange":"btn-outline-white text-white"}`} style={{padding:"0.188rem 0.625rem"}} aria-pressed={viewMode==="list"} onClick={()=>setViewMode("list")}><i className="bx bx-list-ul me-2" aria-hidden="true"/>List View</button></div>
   <div className="d-lg-none d-flex gap-1"><button type="button" className={`btn btn-sm ${viewMode==="grid"?"btn-orange":"btn-outline-white text-white"}`} onClick={()=>setViewMode("grid")}>Grid</button><button type="button" className={`btn btn-sm ${viewMode==="list"?"btn-orange":"btn-outline-white text-white"}`} onClick={()=>setViewMode("list")}>List</button></div>
  </div>
 </div>
 {filterKeys.some(key=>selected[key].length>0)&&<div className="mb-3 border px-3 py-2 bg-white rounded-2"><strong className="d-block mb-2">Filter:</strong><div className="d-flex flex-wrap gap-2">{filterKeys.flatMap(key=>selected[key].map(id=>{const label=options[key]?.find(opt=>opt.id===id)?.name||String(id);return <span key={`${key}-${id}`} className="badge bg-primary d-inline-flex align-items-center gap-2">{label}<button type="button" className="btn-close btn-close-white" style={{fontSize:"0.55rem"}} aria-label={`Remove ${label}`} onClick={()=>toggleFilter(key,id)}/></span>}))}</div></div>}
 {error&&<div className="alert alert-danger" role="alert">{error}<button className="btn btn-sm btn-outline-danger ms-2" onClick={()=>setRetryCount(n=>n+1)}>Retry</button></div>}
 <div className="row g-3 mt-1">{items.map((company,i)=>{
 const name=company.organization_name||"Company";
 const url=companyListingConnectHref(company.organization_slug);
 const location=mode==="buyer"?(company.user?.address||company.company_location):company.company_location;
 const fields: {label:string;value?:string|null}[]=mode==="buyer"?[{label:"Product",value:company.user?.products}]:[
 {label:"Website",value:company.company_website},{label:"Core Activity",value:company.core_activity_name},{label:"Activity",value:company.activity_name},{label:"Category",value:company.category_name},{label:"Sub Category",value:company.sub_category_name}];
 return <div className={viewMode==="list"?"col-12":"col-12 col-sm-6"} key={String(company.id||company.organization_slug||i)}>
 <article className={`card shadow-sm border comapnycardlogo h-100 ${viewMode==="list"?"flex-row p-2":""}`}>
 <div className={`card-header border-0 ${viewMode==="list"?"p-0 ps-2 bg-white":""}`} style={{minWidth:viewMode==="list"?115:undefined}}>
 <div className={`bigmobile d-sm-flex ${viewMode==="list"?"":"align-items-md-center gap-2"}`}>
 <div className={viewMode==="list"?"me-0":"me-xl-3 me-1 text-center mb-sm-0 mb-2"}>
 <img src={assetUrl(company.company_logo_file)} alt={name} loading="lazy" width={viewMode==="list"?100:180} height={viewMode==="list"?100:180} style={{maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>
 </div>
 {viewMode==="grid"&&<div className="mt-md-0"><h5 className="card-title mb-1">{name}</h5>{location&&<div className="companyitems companylocation mb-2 d-sm-flex gap-2"><b className="fw-semibold">Location:</b><p className="mb-0">{location}</p></div>}</div>}
 </div></div>
 <div className={`card-body ${viewMode==="list"?"pt-2":""}`}>
 {viewMode==="list"&&<><h5 className="card-title mb-1">{name}</h5>{location&&<div className="companyitems companylocation companylocationlist mb-2 d-sm-flex gap-2"><b className="fw-semibold">Location:</b><p className="mb-0">{location}</p></div>}</>}
 {fields.filter(field=>field.value).map(field=><div key={field.label} className="companyitems mb-2 d-sm-flex gap-2"><b className="fw-semibold">{field.label}:</b><p className="mb-0" style={{overflowWrap:"anywhere"}}>{field.value}</p></div>)}
 <div className="featuredCompaniesPara d-flex align-items-center gap-1 flex-wrap">{company.products?.filter(p=>p.slug&&p.title).map((product,idx)=><Link key={String(product.id||idx)} href={`/products/${encodeURIComponent(product.slug!)}`} className="small badge text-decoration-none text-white btn-orange text-start" style={{whiteSpace:"pre-wrap",lineHeight:"17px",padding:"2px 6px",fontSize:10}}>{product.title}</Link>)}</div>
 </div>
 <div className={`card-footer ${viewMode==="list"?"bg-white border-0 pe-2 pt-0":""}`}><div className={`d-flex gap-2 ${viewMode==="list"?"align-items-center h-100":"flex-row"}`}>
 {mode==="buyer"?(url?<Link href={url} className="d-block w-100 pt-2 btn btn-orange text-nowrap px-5">Connect</Link>:<span className="text-muted small">Details unavailable</span>):url?<Link href={url} className="d-block w-100 pt-2 btn btn-primary si-company-view-details text-nowrap px-5">View Details</Link>:<span className="text-muted small">Details unavailable</span>}
 </div></div></article></div>})}</div>
 {!loading&&!error&&items.length===0&&<p className="text-muted py-4">No companies found.</p>}
 {loading&&<p className="text-center py-4" role="status">Loading companies...</p>}
 {!error&&canLoadMore&&items.length>0&&<div ref={loadSentinel} className="py-2" aria-hidden="true"/>}
 </div></div></main>;
}
