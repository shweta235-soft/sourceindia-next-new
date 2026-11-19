"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
type Named={name:string;slug:string};
type Item={id:number|string;name:string;file_name?:string|null;product_count?:number|string};
type Group={id:number|string;name:string;items?:Item[]};
type Detail={name:string;category?:Named;sub_category?:Named;item_categories?:Group[]};
type Result={subcategory?:Detail;pagination?:{hasMore?:boolean}};
export default function ItemSubcategoryPage({slug,endpoint}:{slug:string;endpoint?:string}){
 const [detail,setDetail]=useState<Detail|null>(null);
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(true);
 const [loadingMore,setLoadingMore]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{setDetail(null);setPage(1);setHasMore(false);setError(false)},[slug]);
 useEffect(()=>{
  let active=true;
  if(page===1)setLoading(true);else setLoadingMore(true);
  apiFetch<Result>(`${endpoint || "/categories/sub-items"}?slug=${encodeURIComponent(slug)}&page=${page}&limit=8`)
   .then(data=>{if(!active)return;
    if(data.subcategory){
     setDetail(prev=>page===1?data.subcategory!:({...data.subcategory!,item_categories:[...(prev?.item_categories||[]),...(data.subcategory?.item_categories||[])]}));
     setHasMore(Boolean(data.pagination?.hasMore));
    }else if(page===1)setDetail(null);
   }).catch(()=>{if(active)setError(true)})
   .finally(()=>{if(active){setLoading(false);setLoadingMore(false)}});
  return()=>{active=false};
 },[slug,page,endpoint]);
 return <section className="categorySection py-md-4 pt-2 my-4"><div className="container-xxl">
 {loading?<div role="status"><div className="placeholder-glow mb-4"><span className="placeholder col-3" style={{height:26}}/></div><div className="card mb-3"><div className="card-body"><div className="row g-3">{Array.from({length:12},(_,i)=><div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2"><div className="card p-2 placeholder-glow"><span className="placeholder w-100" style={{height:125}}/><span className="placeholder col-9 mt-2"/></div></div>)}</div></div></div></div>:
 error&&!detail?<p role="alert">Unable to load item categories. Please try again later.</p>:
 !detail?<p>Subcategory not found.</p>:<>
 <nav aria-label="breadcrumb" className="mb-3"><ol className="breadcrumb mb-0">
 <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Home</Link></li>
 <li className="breadcrumb-item"><Link href="/categories" className="text-decoration-none">Categories</Link></li>
 {detail.category&&<li className="breadcrumb-item"><Link href={`/categories/${detail.category.slug}`} className="text-decoration-none">{detail.category.name}</Link></li>}
 {detail.sub_category&&<li className="breadcrumb-item"><Link href={`/categories/${detail.category?.slug||""}/${detail.sub_category.slug}`} className="text-decoration-none">{detail.sub_category.name}</Link></li>}
 <li className="breadcrumb-item active" aria-current="page">{detail.name}</li></ol></nav>
 <h4 className="fw-semibold mb-3 color-primary text-capitalize">{detail.name}</h4>
 {(detail.item_categories||[]).length?(detail.item_categories||[]).map((group,index)=><div className="card mb-3 card-border" key={`${group.id}-${index}`}><div className="card-body"><div className="pb-4">
 <div className="d-flex justify-content-between align-items-center mb-3"><h6 className="fw-semibold mb-0 text-capitalize">{group.name}</h6></div>
 <div className="row g-3">{(group.items||[]).length?(group.items||[]).map(item=><div className="col-6 col-sm-4 col-md-3 col-lg-2 text-center itemcolblock" key={item.id}>
 <div className="card border-0 shadow-sm h-100"><div className="card-body p-2"><Link href={`/products?item_id=${item.id}`} className="text-decoration-none">
 <img src={assetUrl(item.file_name)} className="img-fluid rounded mb-2 w-100" alt={item.name} style={{height:125,objectFit:"contain"}} loading="lazy" decoding="async" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>
 <h6 className="small fw-semibold mb-1">{item.name}</h6></Link>
 {Number(item.product_count||0)>0&&<div className="text-success small">({item.product_count})</div>}
 </div></div></div>):<p className="text-muted small">No items found.</p>}</div>
 </div></div></div>):<div className="card mb-3 card-border"><div className="card-body"><p className="text-center text-muted">No item categories found.</p></div></div>}
 {hasMore&&<div className="text-center mt-4"><button type="button" className="btn btn-primary" disabled={loadingMore} onClick={()=>setPage(v=>v+1)}>{loadingMore?"Loading...":"Load More"}</button></div>}
 {error&&<p className="text-danger text-center mt-2" role="alert">Could not load more items.</p>}
 </>}
 </div></section>;
}
