"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
import ProductEnquiryModal from "./ProductEnquiryModal";

type Entry={id:number;name:string;product_count?:number;organization_name?:string;item_category_id?:number;item_subcategory_id?:number};
type Product={id:number;slug?:string;title?:string;file_name?:string;company_name?:string;state_name?:string;company_id?:number};
type ProductResponse={products?:Product[];total?:number};
type Hierarchy={category_id?:number;sub_category_id?:number;item_category_id?:number;item_subcategory_id?:number;item_id?:number};
type FilterKey="category"|"sub_category"|"item_category_id"|"item_subcategory_id"|"item_id"|"user_state"|"company_id";
type FilterGroup={key:FilterKey;label:string;items:Entry[]};
const takeArray=(v:unknown):Entry[]=>Array.isArray(v)?v as Entry[]:[];
const uniqueIds=(a:unknown[]):number[]=>[...new Set(a.map(Number).filter(n=>Number.isInteger(n)&&n>0))];
export default function ProductsListing(){
 const params=useSearchParams();const query=params.toString();
 const [search,setSearch]=useState(params.get("search")||"");const [input,setInput]=useState(search);
 const [filters,setFilters]=useState<Partial<Record<FilterKey,number[]>>>({});
 const [groups,setGroups]=useState<Partial<Record<FilterKey,Entry[]>>>({});
 const [enquiryProduct,setEnquiryProduct]=useState<Product|null>(null);
 const [products,setProducts]=useState<Product[]>([]);const [total,setTotal]=useState(0);
 const [sort,setSort]=useState("");const [list,setList]=useState(false);const [mobileFilters,setMobileFilters]=useState(false);
 const [loading,setLoading]=useState(true);const [moreLoading,setMoreLoading]=useState(false);const [page,setPage]=useState(1);const [hasMore,setHasMore]=useState(false);
 const [error,setError]=useState("");const [filterSearch,setFilterSearch]=useState<Record<string,string>>({});
 const request=useRef(0);const sentinel=useRef<HTMLDivElement>(null);const ready=useRef(false);
 const ids=useCallback((key:FilterKey)=>filters[key]||[],[filters]);
 const setIds=(key:FilterKey,values:number[])=>setFilters(f=>({...f,[key]:values}));
 const toggle=(key:FilterKey,id:number)=>setFilters(f=>{const current=f[key]||[];return {...f,[key]:current.includes(id)?current.filter(n=>n!==id):[...current,id]};});
 const loadOptions=useCallback(async()=>{
  const selected=(k:FilterKey)=>filters[k]||[];
  const cat=selected("category"),sub=selected("sub_category"),itemcat=selected("item_category_id"),itemsub=selected("item_subcategory_id");
  const calls:[FilterKey,Promise<unknown>][]=[
   ["category",apiFetch("categories?is_delete=0")],
   ["company_id",apiFetch("products/companies?is_delete=0")],
   ["user_state",apiFetch(`location/states/101?category_ids=${cat}&subcategory_ids=${sub}&item_category_ids=${itemcat}&item_subcategory_ids=${itemsub}`)]
  ];
  if(cat.length)calls.push(["sub_category",apiFetch("sub_categories/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories:cat})})]);
  if(cat.length&&sub.length)calls.push(["item_category_id",apiFetch("item_category/by-selected-category-subcategory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories:cat,subcategories:sub})})]);
  if(cat.length&&sub.length&&itemcat.length)calls.push(["item_subcategory_id",apiFetch("item_sub_category/by-selected-category-subcategory-itemcategory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories:cat,subcategories:sub,itemCategories:itemcat})})]);
  if(cat.length&&sub.length&&itemcat.length&&itemsub.length)calls.push(["item_id",apiFetch("items/by-selected-category-subcategory-itemcategory-itemsubcategory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories:cat,subcategories:sub,itemCategories:itemcat,itemSubCategories:itemsub})})]);
  const settled=await Promise.allSettled(calls.map(x=>x[1]));
  setGroups(prev=>{const next={...prev};calls.forEach(([key],i)=>{const result=settled[i];if(result.status==="fulfilled"){const val=result.value as {companies?:Entry[]};next[key]=takeArray(key==="company_id"?val?.companies:result.value).filter(x=>(x.product_count??1)>0);}});if(!cat.length)next.sub_category=[];if(!cat.length||!sub.length)next.item_category_id=[];if(!cat.length||!sub.length||!itemcat.length)next.item_subcategory_id=[];if(!cat.length||!sub.length||!itemcat.length||!itemsub.length)next.item_id=[];return next;});
 },[filters]);
 useEffect(()=>{void loadOptions();},[loadOptions]);
 useEffect(()=>{
  const term=(params.get("search")||"").trim();setSearch(term);setInput(term);
  const keys:[string,FilterKey][]=[["category_id","category"],["subcategory_id","sub_category"],["item_category_id","item_category_id"],["item_subcategory_id","item_subcategory_id"],["item_id","item_id"]];
  const found=keys.find(([name])=>params.get(name));
  ready.current=false;
  if(!found){setFilters({});ready.current=true;return;}
  const id=Number(params.get(found[0]));if(!Number.isInteger(id)||id<=0){setFilters({});ready.current=true;return;}
  let active=true;
  apiFetch<Hierarchy>(`products/item-hierarchy/${({category:"category",sub_category:"subcategory",item_category_id:"item_category",item_subcategory_id:"item_subcategory",item_id:"item"} as Record<FilterKey,string>)[found[1]]}/${id}`).then(h=>{
   if(!active)return;setFilters({category:h.category_id?[h.category_id]:[],sub_category:h.sub_category_id?[h.sub_category_id]:[],item_category_id:h.item_category_id?[h.item_category_id]:[],item_subcategory_id:h.item_subcategory_id?[h.item_subcategory_id]:[],item_id:h.item_id?[h.item_id]:[]});
  }).catch(()=>{if(active)setFilters({[found[1]]:[id]});}).finally(()=>{if(active)ready.current=true;});
  return()=>{active=false;};
 },[query,params]);
 const fetchPage=useCallback(async(n:number,append:boolean)=>{
  const ticket=++request.current;
  if(append)setMoreLoading(true);else {setLoading(true);setError("");}
  try{
   const q=new URLSearchParams({is_delete:"0",status:"1",is_approve:"1",is_front:"1",limit:"15",page:String(n)});
   for(const key of ["category","sub_category","item_category_id","item_subcategory_id","item_id","user_state","company_id"] as FilterKey[]){if(ids(key).length)q.set(key,ids(key).join(","));}
   if(sort)q.set("sort_by",sort);
   if(search.trim()){
    const useKeyword=!ids("item_subcategory_id").length;
    if(useKeyword){
     q.set("search",search.trim());
     if(search.trim().length>=2){try{const suggestions=await apiFetch<unknown>(`front_menu/main-search?q=${encodeURIComponent(search.trim())}&type=product`,{method:"POST"});const kws=uniqueIds(takeArray(suggestions).map(x=>(x as Entry & {keyword_id?:number}).keyword_id??x.id));if(kws.length)q.set("keyword_ids",kws.join(","));}catch{/* React also falls back to plain search */}}
    }
   }
   const result=await apiFetch<ProductResponse>(`products?${q}`);
   if(ticket!==request.current)return;
   const rows=Array.isArray(result.products)?result.products:[];const count=Number(result.total)||0;
   setProducts(old=>append?[...old,...rows]:rows);setTotal(count);setPage(n);setHasMore(rows.length===15&&n*15<count);
  }catch(e){if(ticket===request.current)setError(e instanceof Error?e.message:"Could not load products");}
  finally{if(ticket===request.current){setLoading(false);setMoreLoading(false);}}
 },[ids,search,sort]);
 const filtersKey=JSON.stringify(filters);
 useEffect(()=>{if(!ready.current)return;setPage(1);setHasMore(false);void fetchPage(1,false);},[fetchPage,filtersKey,query]);
 useEffect(()=>{const node=sentinel.current;if(!node||!hasMore||loading||moreLoading)return;const obs=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)void fetchPage(page+1,true);},{rootMargin:"150px"});obs.observe(node);return()=>obs.disconnect();},[fetchPage,hasMore,loading,moreLoading,page]);
 useEffect(()=>{const timer=setTimeout(()=>setSearch(input),700);return()=>clearTimeout(timer);},[input]);
 const sections:FilterGroup[]=[{key:"category",label:"Category",items:groups.category||[]},{key:"sub_category",label:"Sub Category",items:groups.sub_category||[]},{key:"item_category_id",label:"Item Category",items:groups.item_category_id||[]},{key:"item_subcategory_id",label:"Item Sub Category",items:groups.item_subcategory_id||[]},{key:"user_state",label:"State",items:groups.user_state||[]},{key:"company_id",label:"Companies",items:groups.company_id||[]}];
 return <div className="container-xxl my-4"><div className="row">
  <div className="col-12 col-lg-3"><aside className={`filter-sidebar mb-4 ${mobileFilters?"show":""}`}>
   <div className="d-lg-none d-flex justify-content-between align-items-center mb-3"><strong>Filters:</strong><button type="button" className="btn-close" onClick={()=>setMobileFilters(false)} aria-label="Close filters"/></div>
   <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside"><h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Product Title</h3><div className="px-2"><input className="form-control" value={input} onChange={e=>setInput(e.target.value)} placeholder="Search products..." aria-label="Search products"/></div></div>
   {sections.map(group=>(group.items.length>0||group.key==="category"||group.key==="user_state"||group.key==="company_id")&&<div key={group.key} className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside"><h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">{group.label}</h3><div className="px-2"><input className="form-control mb-2" placeholder={`Search ${group.label.toLowerCase()}...`} value={filterSearch[group.key]||""} onChange={e=>setFilterSearch(x=>({...x,[group.key]:e.target.value}))}/><div style={{maxHeight:190,overflowY:"auto"}}>{group.items.filter(x=>(x.name||x.organization_name||"").toLowerCase().includes((filterSearch[group.key]||"").toLowerCase())).map(x=><div className="form-check mb-2" key={x.id}><input type="checkbox" className="form-check-input" id={`${group.key}-${x.id}`} checked={ids(group.key).includes(Number(x.id))} onChange={()=>toggle(group.key,Number(x.id))}/><label className="form-check-label text-capitalize" htmlFor={`${group.key}-${x.id}`}>{x.name||x.organization_name} ({x.product_count??0})</label></div>)}</div></div></div>)}
  </aside>{mobileFilters&&<div className="filter-overlay" onClick={()=>setMobileFilters(false)}/>}</div>
  <section className="col-12 col-lg-9 mb-4"><button type="button" className="filterbutton btn btn-primary w-100 d-sm-none mb-2" onClick={()=>setMobileFilters(true)}>Filters</button>
   <div className="d-sm-flex align-items-center justify-content-between mb-2 primary-color-bg px-3 py-2 rounded-2 text-white"><div className="d-flex align-items-center gap-3 flex-wrap"><strong>Sort By :</strong>{[["a_to_z","A to Z"],["z_to_a","Z to A"]].map(([value,label])=><label key={value} className="cursor-pointer"><input type="radio" name="sortBy" checked={sort===value} onChange={()=>setSort(value)} className="me-1"/>{label}</label>)}</div><div className="d-flex align-items-center gap-3"><span>{total} Products</span><button className="btn btn-sm btn-light" onClick={()=>setList(false)} aria-label="Grid view">▦</button><button className="btn btn-sm btn-light" onClick={()=>setList(true)} aria-label="List view">☷</button></div></div>
   {Object.values(filters).some(v=>v?.length)&&<div className="border bg-white rounded-2 p-2 mb-2 d-flex gap-2 flex-wrap align-items-center"><strong>Filter:</strong>{sections.flatMap(g=>ids(g.key).map(id=><button type="button" key={`${g.key}-${id}`} className="badge bg-primary border-0" onClick={()=>toggle(g.key,id)}>{g.items.find(x=>Number(x.id)===id)?.name||g.items.find(x=>Number(x.id)===id)?.organization_name||id} ×</button>))}<button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={()=>setFilters({})}>Clear All</button></div>}
   {error&&<div className="alert alert-danger" role="alert">Products could not be loaded: {error} <button className="btn btn-sm btn-outline-danger ms-2" onClick={()=>void fetchPage(1,false)}>Retry</button></div>}
   <div className="row py-3">{loading?Array.from({length:9},(_,i)=><div className="col-lg-4 col-sm-6 mb-4" key={i}><div className="card p-3"><span className="content-placeholder" style={{height:200}}/><span className="content-placeholder mt-3" style={{height:20}}/></div></div>):products.length?products.map(p=><div key={p.id} className={list?"col-md-6 mb-4":"col-lg-4 col-sm-6 mb-4"}><div className={`card text-dark border overflow-hidden products-list-cards ${list?"flex-row":"h-100"}`}><div className={`d-flex align-items-center justify-content-center ${list?"border-end listviewimg":"border-bottom gridviewimg"}`} style={{height:200,width:list?200:"100%",flexShrink:0}}><img src={assetUrl(p.file_name,"/default-image.png")} alt={p.title||"Product Image"} className="img-fluid p-2" style={{objectFit:"contain",maxHeight:195}} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default-image.png";}}/></div><div className="card-body"><h5 className="card-title">{p.title}</h5><p className="card-text"><i className="bx bx-building"/> {p.company_name}</p><p className="card-text"><i className="bx bx-map"/> {p.state_name}</p>{list&&p.slug&&<Link href={`/products/${p.slug}`} className="btn btn-sm btn-orange text-white w-100">View Details</Link>}</div>{!list&&<div className="card-footer"><div className="d-flex gap-2"><Link href={p.slug?`/products/${p.slug}`:"#"} className="btn btn-sm btn-orange text-white flex-fill">View</Link><button type="button" className="btn btn-sm btn-outline-primary flex-fill" onClick={()=>setEnquiryProduct(p)}>Send Enquiry</button></div></div>}</div></div>):!error&&<div className="col-12 text-center">No products found.</div>}</div>
   {moreLoading&&<p className="text-center">Loading more products...</p>}<div ref={sentinel} style={{height:1}}/>
  </section>
  {enquiryProduct&&<ProductEnquiryModal product={enquiryProduct} onClose={()=>setEnquiryProduct(null)}/>}
 </div></div>;
}
