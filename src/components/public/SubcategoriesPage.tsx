"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
type Item={id:number|string;name:string;product_count?:number|string};
type Sub={id:number|string;name:string;slug:string;file_name?:string|null;product_count?:number|string;item_categories?:Item[]};
type Category={id:number|string;name:string;slug:string;subcategories?:Sub[]};
export default function SubcategoriesPage({slug}:{slug:string}){
 const [category,setCategory]=useState<Category|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;setLoading(true);setError(false);
  apiFetch<{category?:Category}>(`/categories/sub-category-item?slug=${encodeURIComponent(slug)}&page=1&limit=200`)
   .then(data=>{if(active)setCategory(data.category||null)})
   .catch(()=>{if(active)setError(true)})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[slug]);
 return <section className="categorySection py-md-4 pt-2 my-4"><div className="container-xxl">
 <nav aria-label="breadcrumb" className="mb-3"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><Link href="/">Home</Link></li><li className="breadcrumb-item"><Link href="/categories">Categories</Link></li><li className="breadcrumb-item active" aria-current="page">{category?.name||slug}</li></ol></nav>
 {loading?<div role="status" className="row g-3">{Array.from({length:6},(_,i)=><div className="col-lg-4 col-sm-6" key={i}><div className="card p-4 placeholder-glow"><span className="placeholder col-8 mb-3"/><span className="placeholder col-12"/><span className="placeholder col-9"/></div></div>)}</div>:
 error?<p role="alert">Unable to load subcategories. Please try again later.</p>:
 !category?<p>Category not found.</p>:<>
 <h1 className="h4 fw-semibold mb-4">{category.name}</h1>
 <div className="row g-3">{(category.subcategories||[]).map((sub,i)=><div className="col-lg-4 col-sm-6" key={sub.id}>
 <div className="card h-100 border rounded-3"><div className="card-body">
 <div className="d-flex align-items-start justify-content-between gap-2"><h2 className="h6 fw-semibold"><Link className="text-decoration-none" href={`/categories/${slug}/${sub.slug}`}>{sub.name}</Link></h2><Link href={`/categories/${slug}/${sub.slug}`} aria-label={`View ${sub.name}`}>→</Link></div>
 {sub.file_name&&<img src={assetUrl(sub.file_name)} alt={sub.name} loading="lazy" className="img-fluid my-2" style={{maxHeight:110,objectFit:"contain"}} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>}
 <ul className="list-unstyled mb-2">{(sub.item_categories||[]).filter(item=>Number(item.product_count||0)>0).sort((a,b)=>Number(b.product_count||0)-Number(a.product_count||0)).slice(0,3).map(item=><li className="small mb-2" key={item.id}><Link href={`/products?category_id=${category.id}&subcategory_id=${sub.id}&item_category_id=${item.id}`}>{item.name}</Link></li>)}</ul>
 <Link className="small text-decoration-none" style={{color:"#ff6600"}} href={`/categories/${slug}/${sub.slug}`}>View all →</Link>
 </div></div></div>)}</div>
 {!(category.subcategories||[]).length&&<p>No subcategories found.</p>}
 </>}
 </div></section>;
}
