"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {assetUrl} from "@/lib/asset";

type Product={id?:number|string;slug?:string;file_name?:string;title?:string;company_name?:string;price?:string|number};
export default function LatestProductSlider({products,categoryName}:{products:Product[];categoryName:string}){
 const slider=useRef<HTMLDivElement>(null);
 const [arrows,setArrows]=useState({prev:false,next:false});
 const update=useCallback(()=>{const el=slider.current;if(!el)return;const overflow=el.scrollWidth>el.clientWidth+1;setArrows({prev:overflow&&el.scrollLeft>1,next:overflow&&el.scrollLeft+el.clientWidth<el.scrollWidth-1})},[]);
 useEffect(()=>{update();const observer=new ResizeObserver(update);if(slider.current)observer.observe(slider.current);return()=>observer.disconnect()},[products,update]);
 if(!products.length)return null;
 return <div className="react-latest-products"><h5>Latest {categoryName} Products</h5><div className="react-latest-slider" ref={slider} onScroll={update}>{products.map((product,i)=><div className="react-latest-card" key={product.id??i}><Link href={`/products/${product.slug||""}`}><div className="react-latest-thumb"><img src={assetUrl(product.file_name||null)} alt={product.title||"Product"} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/default.png"}}/></div><div className="react-latest-info"><div className="react-latest-name" title={product.title}>{(product.title??"").length>35?(product.title??"").slice(0,35)+"...":(product.title??"")}</div>{product.company_name&&<><div className="react-latest-separator"/><div className="react-latest-sold-label">Sold by :</div><div className="react-latest-company" title={product.company_name}>{product.company_name}</div></>}{product.price!==undefined&&product.price!==null&&String(product.price).trim()!==""&&<div className="react-latest-price">Price: ₹ {product.price}</div>}</div></Link></div>)}</div>{arrows.prev&&<button type="button" className="react-latest-arrow react-latest-prev" aria-label="Previous products" onClick={()=>slider.current?.scrollBy({left:-450,behavior:"smooth"})}>‹</button>}{arrows.next&&<button type="button" className="react-latest-arrow react-latest-next" aria-label="Next products" onClick={()=>slider.current?.scrollBy({left:450,behavior:"smooth"})}>›</button>}</div>
}
