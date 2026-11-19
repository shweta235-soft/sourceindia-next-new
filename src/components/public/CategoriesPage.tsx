"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
import LatestProductSlider from "@/components/home/LatestProductSlider";

type Item={id:number|string;name:string;product_count?:number|string};
type Subcategory={id:number|string;name:string;slug:string;file_name?:string|null;product_count?:number|string;item_categories?:Item[]};
type Category={id:number|string;name:string;slug:string;file_name?:string|null;subcategories?:Subcategory[]};
type Product={id?:number|string;slug?:string;file_name?:string;title?:string;company_name?:string;price?:string|number};

export default function CategoriesPage(){
 const [categories,setCategories]=useState<Category[]>([]);
 const [products,setProducts]=useState<Record<string,Product[]>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;
  apiFetch<Category[]>("/categories/category-item?is_delete=0&status=1&limit=undefined&is_home=0")
   .then(data=>{if(active)setCategories(Array.isArray(data)?data:[])})
   .catch(()=>{if(active)setError(true)})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  let active=true;
  categories.forEach(cat=>{
   const query=new URLSearchParams({category:String(cat.id),is_delete:"0",status:"1",is_approve:"1",is_front:"1",limit:"10",sort_by:"newest"});
   apiFetch<{products?:Product[]}>(`/products?${query}`)
    .then(data=>{if(active)setProducts(prev=>({...prev,[String(cat.id)]:Array.isArray(data.products)?data.products:[]}))})
    .catch(()=>{if(active)setProducts(prev=>({...prev,[String(cat.id)]:[]}))});
  });
  return()=>{active=false};
 },[categories]);
 if(loading)return <div className="container-xxl py-5" role="status">{[0,1].map(n=><section key={n} className="categorySection py-md-4 pt-2 my-4"><div className="categoryMainBox"><div className="categoryMainHeader"><span className="content-placeholder d-block mb-3" style={{height:24,width:"30%"}}/></div><div className="categoryMainBody"><div className="categoryPromoCard categoryPromoSkeleton"/><div className="subcategoryGrid">{Array.from({length:6},(_,i)=><div key={i} className="subcategoryCard subcategoryCardSkeleton"/>)}</div></div></div></section>)}</div>;
 if(error)return <p className="text-center my-5 text-muted" role="alert">Unable to load categories. Please try again later.</p>;
 if(!categories.length)return <p className="text-center my-5 text-muted">No categories found.</p>;
 return <>{categories.map(cat=>{
  const subs=(cat.subcategories||[]).filter(sub=>Number(sub.product_count||0)>0).slice(0,6);
  return <section key={cat.id} className="categorySection py-md-4 pt-2 my-4"><div className="container-xxl"><div className="categoryMainBox">
   <div className="categoryMainHeader"><h4 className="categoryMainTitle">{cat.name}</h4><span className="categoryMainAccent"/></div>
   <div className="categoryMainBody">
    <div className="categoryPromoCard">
     {cat.file_name&&<img src={assetUrl(cat.file_name)} className="categoryPromoImage" alt={cat.name} loading="lazy" decoding="async" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/>}
     <div className="categoryPromoOverlay"/>
     <div className="categoryPromoContent"><Link href={`/categories/${cat.slug}`} className="categoryPromoBtn"><span>Explore {cat.name}</span><span className="categoryPromoBtnArrow">→</span></Link></div>
    </div>
    <div className="subcategoryGrid">{subs.length?subs.map(sub=><div key={sub.id} className="subcategoryCard">
     <div className="subcategoryCardHeader"><Link href={`/categories/${cat.slug}/${sub.slug}`} className="subcategoryCardTitleLink"><h6 className="subcategoryCardTitle">{sub.name}</h6></Link><Link href={`/categories/${cat.slug}/${sub.slug}`} className="subcategoryArrow" aria-label={`Explore ${sub.name}`}><span>→</span></Link></div>
     <div className="subcategoryCardContent"><ul className="categoryItemList">{(sub.item_categories||[]).filter(item=>Number(item.product_count||0)>0).slice(0,4).map(item=><li key={item.id}><Link href={`/products?category_id=${cat.id}&subcategory_id=${sub.id}&item_category_id=${item.id}`}>{item.name?.length>20?item.name.slice(0,20)+"...":item.name}</Link></li>)}</ul>
      {sub.file_name&&<div className="subcategoryThumb"><img src={assetUrl(sub.file_name)} alt={sub.name} loading="lazy" decoding="async" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/></div>}
     </div>
     <Link href={`/categories/${cat.slug}/${sub.slug}`} className="subcategoryViewAll"><span>View all</span><span className="subcategoryViewAllArrow">→</span></Link>
    </div>):<p className="subcategoryEmpty">No subcategories found.</p>}</div>
   </div>
   <LatestProductSlider products={products[String(cat.id)]||[]} categoryName={cat.name}/>
  </div></div></section>
 })}</>;
}
