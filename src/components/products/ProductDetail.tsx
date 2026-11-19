"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {apiFetch} from "@/lib/api";
import {assetUrl} from "@/lib/asset";
import ProductEnquiryModal from "./ProductEnquiryModal";
import ProductReviewModal from "./ProductReviewModal";

type ImageFile={id?:number|string;file?:string};
type Category={id?:number|string;name?:string;slug?:string;file_name?:string;image?:string;product_count?:number;itemcategory_name?:string;item_category_name?:string;ItemCategory?:{name?:string}};
type Related={id?:number;slug?:string;title?:string;file_name?:string};
type Product={
 id?:number;title?:string;slug?:string;file_name?:string;images?:ImageFile[];
 category_id?:number|string;category?:number|string;sub_category_id?:number|string;subcategory_id?:number|string;item_category_id?:number|string;itemCategoryId?:number|string; company_id?:number;company_name?:string;company_slug?:string;company_website?:string;
 category_name?:string;sub_category_name?:string;item_category_name?:string;
 item_subcategory_name?:string;core_activity_name?:string;
 short_description?:string;description?:string;similar_products?:Related[];
 averageRating?:number|string;price?:string|number; brief_company?:string;organizations_product_description?:string;company_location?:string;created_at?:string;reviews_count?:number;company_logo?:string;
};
const specs:[keyof Product,string][]=[
 ["category_name","Category"],["sub_category_name","Sub Category"],
 ["item_category_name","Item Category"],["item_subcategory_name","Item Type"],
 ["core_activity_name","Nature of Business"]
];
function memberSince(date?:string){
 if(!date)return "—";
 const created=new Date(date);
 if(Number.isNaN(created.getTime()))return "—";
 const days=Math.max(0,Math.floor((Date.now()-created.getTime())/86400000));
 const years=Math.floor(days/365),months=Math.floor(days/30);
 if(years>0)return `${years} Year${years>1?"s":""}`;
 if(months>0)return `${months} Month${months>1?"s":""}`;
 if(days>0)return `${days} Day${days>1?"s":""}`;
 return "Today";
}
function safeUrl(url:string){try{const u=new URL(url.startsWith("http")?url:`https://${url}`);return ["http:","https:"].includes(u.protocol)?u.href:undefined;}catch{return undefined;}}
export default function ProductDetail({slug}:{slug:string}){
 const [product,setProduct]=useState<Product|null>(null);
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const [selected,setSelected]=useState(0);
 const [sellerProducts,setSellerProducts]=useState<Related[]>([]);
 const [popularCategories,setPopularCategories]=useState<Category[]>([]);
 const [currentItemTypes,setCurrentItemTypes]=useState<Category[]>([]);
 const [quoteQty,setQuoteQty]=useState("");
 const [quoteUnit,setQuoteUnit]=useState("Piece");
 const [showEnquiry,setShowEnquiry]=useState(false);
 const [showReview,setShowReview]=useState(false);
 const similarTrack=useRef<HTMLDivElement>(null);
 const sellerTrack=useRef<HTMLDivElement>(null);
 const scrollCarousel=(track:HTMLDivElement|null,direction:number)=>{
  if(!track)return;
  const slide=track.querySelector<HTMLElement>(".pd-similar-slide");
  const rawGap=parseFloat(getComputedStyle(track).columnGap);
  const gap=Number.isFinite(rawGap)?rawGap:0;
  const width=slide?.getBoundingClientRect().width||280;
  track.scrollBy({left:direction*(width+gap),behavior:"smooth"});
 };
 const scrollSeller=(direction:number)=>scrollCarousel(sellerTrack.current,direction);
 const scrollSimilar=(direction:number)=>scrollCarousel(similarTrack.current,direction);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError("");setProduct(null);setSelected(0);
  apiFetch<Product>(`products/details/${encodeURIComponent(slug)}`)
   .then(p=>{if(active)setProduct(p)})
   .catch(()=>{if(active)setError("Product details could not be loaded.")})
   .finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[slug]);
 useEffect(()=>{
  if(!product?.company_slug){setSellerProducts([]);return;}
  let active=true;
  apiFetch<{products?:Related[]}>(`products/companies/${encodeURIComponent(product.company_slug)}`)
   .then(data=>{if(active)setSellerProducts((data.products||[]).filter((p,i,all)=>Boolean(p.slug)&&p.slug!==slug&&all.findIndex(x=>x.slug===p.slug)===i).slice(0,8))})
   .catch(()=>{if(active)setSellerProducts([])});
  return ()=>{active=false};
 },[product?.company_slug,slug]);
 useEffect(()=>{
  let active=true;
  apiFetch<Category[]|{data?:Category[]}>("categories?is_delete=0&status=1&limit=40")
   .then(data=>{if(active)setPopularCategories(Array.isArray(data)?data:Array.isArray(data.data)?data.data:[]);})
   .catch(()=>{if(active)setPopularCategories([])});
  return ()=>{active=false};
 },[]);
 useEffect(()=>{
  const itemCategoryName=String(product?.item_category_name||"").trim().toLowerCase();
  const currentName=String(product?.item_subcategory_name||"").trim().toLowerCase();
  if(!itemCategoryName){setCurrentItemTypes([]);return;}
  let active=true;
  apiFetch<Category[]|{item_sub_categories?:Category[];itemSubCategories?:Category[];item_categories?:Category[];itemCategories?:Category[];data?:Category[]}>("item_sub_category")
   .then(data=>{
    const rows=Array.isArray(data)?data:(data.item_sub_categories||data.itemSubCategories||data.item_categories||data.itemCategories||data.data||[]);
    if(active)setCurrentItemTypes(rows.filter(cat=>String(cat.itemcategory_name||cat.item_category_name||cat.ItemCategory?.name||"").trim().toLowerCase()===itemCategoryName)
     .filter(cat=>String(cat.name||"").trim().toLowerCase()!==currentName)
     .filter(cat=>cat.product_count===undefined||Number(cat.product_count)>0).slice(0,8));
   }).catch(()=>{if(active)setCurrentItemTypes([])});
  return ()=>{active=false};
 },[product?.item_category_name,product?.item_subcategory_name]);
 // Some product APIs include the primary image again in images[].
 // Keep the first occurrence so arrows, dots and thumbnails remain in sync.
 const images:ImageFile[]=[...(product?.file_name?[{id:"main",file:product.file_name}]:[]),...(Array.isArray(product?.images)?product.images:[])]
  .filter((image,index,all)=>Boolean(image.file?.trim())&&all.findIndex(other=>other.file?.trim()===image.file?.trim())===index);
 const related=(product?.similar_products||[]).filter((p,i,a)=>p.slug&&p.slug!==slug&&a.findIndex(q=>q.slug===p.slug)===i).slice(0,8);
 const website=product?.company_website?safeUrl(product.company_website):undefined;
 return <section className="productDetail pt-2 pb-4"><div className="container-xxl">
  <nav aria-label="breadcrumb" className="mb-3"><ol className="breadcrumb mb-0">
   <li className="breadcrumb-item"><Link href="/">Home</Link></li>
   <li className="breadcrumb-item"><Link href="/products">Products</Link></li>
   <li className="breadcrumb-item active" aria-current="page">{product?.title||slug}</li>
  </ol></nav>
  {loading?<div className="row g-4" aria-live="polite"><div className="col-lg-9"><div className="card p-4"><div className="placeholder-glow"><span className="placeholder col-6 mb-4"/><span className="placeholder col-12" style={{height:260}}/></div></div></div><div className="col-lg-3"><div className="card p-4 placeholder-glow"><span className="placeholder col-10"/><span className="placeholder col-8 mt-4"/></div></div></div>:
  error||!product?<div className="alert alert-warning" role="alert">{error||"Product not found."} <Link href="/products">Browse products</Link></div>:
  <>
   <div className="row g-3 pd-main-row">
     <div className="col-xl-3 col-lg-4 col-md-5"><div className="pd-img-sticky">
      <div className="custom-swiper border rounded d-flex align-items-center justify-content-center bg-white position-relative" style={{height:300,overflow:"hidden"}}>
       <img className="swiper-zoom-image" src={assetUrl(images[selected]?.file||product.file_name)} alt={product.title||"Product"} style={{width:"auto",maxWidth:"100%",height:"100%",objectFit:"contain",transition:"transform 0.3s ease"}} onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}}/>
       {images.length>1&&<><button type="button" className="btn btn-light rounded-circle position-absolute top-50 start-0 translate-middle-y ms-2 shadow-sm" onClick={()=>setSelected(i=>(i+images.length-1)%images.length)} aria-label="Previous image" style={{width:36,height:36,padding:0}}>‹</button><button type="button" className="btn btn-light rounded-circle position-absolute top-50 end-0 translate-middle-y me-2 shadow-sm" onClick={()=>setSelected(i=>(i+1)%images.length)} aria-label="Next image" style={{width:36,height:36,padding:0}}>›</button></>}
      </div>
      {images.length>1&&<>
       <div className="d-flex justify-content-center gap-2 mt-2" role="group" aria-label="Product image pagination">
        {images.map((_,i)=><button key={i} type="button" onClick={()=>setSelected(i)} aria-label={`Go to image ${i+1} of ${images.length}`} aria-current={selected===i?"true":undefined} style={{width:10,height:10,borderRadius:"50%",border:"none",padding:0,background:selected===i?"#e56b2f":"#c5c5c5"}}/>)}
       </div>
       <div className="pd-gallery-thumbnails mt-3" role="group" aria-label="Product image thumbnails">
        {images.map((image,i)=><button type="button" key={`${image.id||i}-${i}`} onClick={()=>setSelected(i)} aria-label={`View product image ${i+1}`} aria-pressed={selected===i} className={`pd-gallery-thumb ${selected===i?"pd-gallery-thumb-active":""}`}><img src={assetUrl(image.file)} alt={`${product.title||"Product"} ${i+1}`} loading="lazy" onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}}/></button>)}
       </div>
      </>}
     </div></div>
     <div className="col-xl-6 col-lg-5 col-md-7"><div className="pd-center-col">
      <h1 className="h4 fw-bold mb-3 text-orange" style={{color:"#e56b2f"}}>{product.title}</h1>
      {product.company_name&&<p className="text-secondary">Sold by: {product.company_slug?<Link href={`/companies/${product.company_slug}`} className="fw-semibold text-dark">{product.company_name}</Link>:<strong>{product.company_name}</strong>}</p>}
      {product.price!==undefined&&product.price!==null&&product.price!==""&&<p className="fw-semibold">{String(product.price)}</p>}
      <button type="button" className="btn btn-orange rounded-pill px-4 mb-4" onClick={()=>setShowEnquiry(true)}>Send Inquiry</button>
      {(specs.some(([key])=>!!product[key])||!!website)&&<div className="mb-4"><h2 className="pd-section-title">Product Specifications</h2><table className="pd-spec-table"><tbody>{specs.filter(([key])=>!!product[key]).map(([key,label])=><tr key={key}><td className="spec-key">{label}</td><td className="spec-val">{String(product[key])}</td></tr>)}{website&&<tr><td className="spec-key">Website</td><td className="spec-val"><a href={website} target="_blank" rel="noopener noreferrer">{product.company_website}</a></td></tr>}</tbody></table></div>}
    {product.short_description&&<div className="mt-4"><h2 className="pd-section-title">Product Overview</h2><p>{product.short_description}</p></div>}
    {product.description&&<div className="mt-4"><h2 className="pd-section-title">Additional Information</h2><div className="pd-description pd-description-responsive" dangerouslySetInnerHTML={{__html:product.description}}/></div>}
    <div id="product-enquiry-help" className="pd-interested-banner mb-4"><div className="pd-ib-text"><h2 className="h6">Need this product?</h2><p>Get product details, pricing &amp; availability directly from the seller.</p></div><button type="button" className="btn btn-primary" onClick={()=>setShowEnquiry(true)}>Send Inquiry</button></div>
    {images.length>1&&<div className="mb-4"><h2 className="pd-section-title">Product Images</h2><div className="pd-images-grid">{images.map((im,i)=><button key={i} type="button" className="pd-img-thumb p-0 border-0" aria-label={`View product image ${i+1}`} onClick={()=>setSelected(i)}><img src={assetUrl(im.file)} alt={`${product.title} image ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/></button>)}</div></div>}
    {(product.brief_company||product.organizations_product_description)&&<div className="mb-4"><h2 className="pd-section-title">Company Overview</h2>{product.brief_company&&<p className="text-secondary mb-2">{product.brief_company}</p>}{product.organizations_product_description&&<div className="text-secondary" dangerouslySetInnerHTML={{__html:product.organizations_product_description}}/>}</div>}
    {product.id&&product.company_id&&<div className="mb-4"><h2 className="pd-section-title">Ratings &amp; Reviews</h2><div className="pd-rating-summary">
     <div className="pd-overall-rating"><div className="pd-rbox-header"><span className="pd-rbox-dot"/>Overall Rating</div><div className="pd-rbox-body"><div className="pd-rating-num">{Number(product.reviews_count||0)>0?Number(product.averageRating||0).toFixed(1):"—"}<span className="pd-of5">/5</span></div><div className="pd-rating-stars" aria-label={`${Number(product.averageRating||0).toFixed(1)} out of 5 stars`}>{[1,2,3,4,5].map(value=><span key={value} style={{color:value<=Math.round(Number(product.averageRating)||0)?"#f5a623":"#ddd"}}>★</span>)}</div><div className="pd-rating-count">Reviewed by {Number(product.reviews_count||0)} Users</div><button type="button" className="btn btn-outline-primary btn-sm mt-2 rounded-pill px-3" onClick={()=>setShowReview(true)}>Write a Review</button></div></div>
     <div className="pd-satisfaction"><div className="pd-rbox-header"><span className="pd-rbox-dot"/>User Satisfaction</div><div className="pd-rbox-body"><div className="pd-sat-circles">{["Response","Quality","Delivery"].map(label=>{const percentage=Math.min(100,Math.max(0,Number(product.averageRating||0)*20));return <div className="pd-sat-circle" key={label}><svg width="66" height="66" viewBox="0 0 66 66" role="img" aria-label={`${label}: ${Math.round(percentage)} percent`}><circle cx="33" cy="33" r="27" stroke="#e8edf6" strokeWidth="7" fill="none"/><circle cx="33" cy="33" r="27" stroke="#1a6fd8" strokeWidth="7" fill="none" strokeDasharray={`${(percentage/100)*169.65} 169.65`} strokeLinecap="round"/></svg><span className="pd-sc-label">{label}</span></div>})}</div></div></div>
    </div></div>}
    </div></div>
    <aside className="col-xl-3 col-lg-3 col-md-12"><div className="pd-sidebar-sticky"><div className="card sidebar-company-card"><div className="card-body"><div className="sidebar-company-head mb-3"><div className="sidebar-logo"><img src={product.company_logo?assetUrl(product.company_logo):"/company.png"} alt={`${product.company_name||"Seller"} logo`} onError={e=>{if(!e.currentTarget.src.endsWith("/company.png"))e.currentTarget.src="/company.png"}} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:6,border:"1px solid #eee"}}/></div><div className="flex-grow-1"><h2 className="sidebar-company-name h6 mb-1">{product.company_name||"Seller information unavailable"}</h2><div className="sidebar-company-location text-muted small"><i className="bx bx-map" aria-hidden="true"/> {product.company_location||"N/A"}</div><div className="mt-2 rating-row"><span className="rating-stars" style={{color:"#f5c518"}}>{Array.from({length:5},(_,i)=>i<Math.round(Number(product.averageRating)||0)?"★":"☆").join("")}</span>{!!product.reviews_count&&<small className="text-muted ms-2">({product.reviews_count})</small>}</div></div></div><hr/><div className="meta-list"><div className="d-flex align-items-start gap-2 mb-3"><i className="bx bx-calendar text-secondary" aria-hidden="true"/><div><div className="meta-label">Member Since</div><div className="meta-value">{memberSince(product.created_at)}</div></div></div><div className="d-flex align-items-start gap-2 mb-3"><i className="bx bx-building text-secondary" aria-hidden="true"/><div><div className="meta-label">Nature of Business</div><div className="meta-value">{product.core_activity_name||"N/A"}</div></div></div></div>{product.company_slug&&<Link href={`/companies/${product.company_slug}`} className="view-company-link text-decoration-none">View Company Details →</Link>}</div></div><Link href={`/products?${new URLSearchParams(product.item_category_id?{item_category_id:String(product.item_category_id)}:product.sub_category_id?{subcategory_id:String(product.sub_category_id)}:product.category_id?{category_id:String(product.category_id)}:{search:product.title||""}).toString()}`} className="pd-similar-banner-link" aria-label="View similar products"><img src="/product-similar-banner-reference.png" alt="Looking for more similar products? View Similar Products" className="pd-similar-banner-image" loading="lazy"/></Link><div className="pd-quote-widget mt-3"><p className="pd-qw-title">Looking for <span>{product.title}?</span></p><label htmlFor="pd-quote-qty">Quantity</label><div className="pd-qty-row"><input id="pd-quote-qty" type="number" min="1" className="form-control" placeholder="Qty" value={quoteQty} onChange={e=>setQuoteQty(e.target.value)}/><input aria-label="Unit" className="form-control" value={quoteUnit} onChange={e=>setQuoteUnit(e.target.value)}/></div><button type="button" className="btn-get-quote" onClick={()=>setShowEnquiry(true)}>Get Quote Now</button></div><div className="card mt-3 shadow-sm pdboost-card"><div className="card-body p-1"><Link href="/registration" className="pbr-banner-link" aria-label="Join SourceIndia promotional banner"><img src="/img1.png" className="w-100" alt="Join SourceIndia" loading="lazy" decoding="async" /></Link></div></div></div></aside>
   </div>
   {sellerProducts.length>0&&<div className="mt-5 companyProducts pd-seller-products">
    <h2 className="pd-pop-cats-title">More Products From This Seller</h2>
    <div className="pd-similar-carousel">
     {sellerProducts.length>1&&<><button type="button" className="pd-similar-arrow pd-similar-prev" aria-label="Previous seller products" onClick={()=>scrollSeller(-1)}>‹</button><button type="button" className="pd-similar-arrow pd-similar-next" aria-label="Next seller products" onClick={()=>scrollSeller(1)}>›</button></>}
     <div className="pd-similar-track" ref={sellerTrack} tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();scrollSeller(e.key==="ArrowRight"?1:-1)}}} role="region" aria-label="More products from this seller">
      {sellerProducts.filter(p=>p.slug).map((p,i)=><div key={`${p.slug}-${i}`} className="pd-similar-slide"><div className="productBox productBoxswiper p-3 bg-white"><div className="middlepro"><div className="ProImg ProImgDetail"><Link href={`/products/${p.slug}`}><img src={assetUrl(p.file_name)} alt={p.title||"Product"} loading="lazy" style={{width:180,height:180,maxWidth:"100%",objectFit:"contain"}} onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}}/></Link></div><div className="productlink"><p className="mb-0 title-clamp">{p.title}</p><Link href={`/products/${p.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2" aria-label={`View ${p.title||"product"}`}><span className="pe-2">View</span><span aria-hidden="true">→</span></Link></div></div></div></div>)}
     </div>
    </div>
   </div>}
   {related.length>0&&<div className="mt-5 companyProducts">
    <h2 className="color-primary pd-pop-cats-title">Find Similar Products</h2>
    <div className="pd-similar-carousel">
     {related.length>1&&<><button type="button" className="pd-similar-arrow pd-similar-prev" aria-label="Previous similar products" onClick={()=>scrollSimilar(-1)}>‹</button><button type="button" className="pd-similar-arrow pd-similar-next" aria-label="Next similar products" onClick={()=>scrollSimilar(1)}>›</button></>}
     <div className="pd-similar-track" ref={similarTrack} tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();scrollSimilar(e.key==="ArrowRight"?1:-1)}}} role="region" aria-label="Similar products carousel">
      {related.map((p,i)=><div key={`${p.slug}-${i}`} className="pd-similar-slide"><div className="productBox productBoxswiper p-3 bg-white"><div className="middlepro"><div className="ProImg ProImgDetail"><Link href={`/products/${p.slug}`}><img src={assetUrl(p.file_name)} alt={p.title||"Product"} loading={i<2?"eager":"lazy"} style={{width:180,height:180,maxWidth:"100%",objectFit:"contain"}} onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}}/></Link></div><div className="productlink"><p className="mb-0 title-clamp">{p.title}</p><Link href={`/products/${p.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2" aria-label={`View ${p.title||"product"}`}><span className="pe-2">View</span><span aria-hidden="true">→</span></Link></div></div></div></div>)}
     </div>
    </div>
   </div>}
   {currentItemTypes.length>0&&<div className="container-xxl py-5">
    <h2 className="pd-pop-cats-title mb-4 h5">Browse Related Categories</h2>
    <div className="pd-related-grid">{currentItemTypes.map(cat=><Link key={cat.id} href={{pathname:"/products",query:{category_id:product.category_id||product.category||"",subcategory_id:product.sub_category_id||product.subcategory_id||"",item_category_id:product.item_category_id||product.itemCategoryId||"",item_subcategory_id:cat.id||""}}} className="pd-rel-cat-card text-decoration-none"><div className="pd-rel-cat-img"><img src={assetUrl(cat.file_name||cat.image)} alt={cat.name||"Category"} style={{width:"100%",height:"100%",objectFit:"contain"}} onError={e=>{if(!e.currentTarget.src.endsWith("/default.png"))e.currentTarget.src="/default.png"}}/></div><span className="pd-rel-cat-name">{cat.name}</span></Link>)}</div>
   </div>}
   {popularCategories.length>0&&<div className="container-xxl pb-5"><h2 className="pd-pop-cats-title h5">Popular Categories</h2><div className="pd-pop-cats">{popularCategories.filter(cat=>cat.slug&&cat.name).map(cat=><Link key={cat.id} href={`/categories/${cat.slug}`} className="pd-pop-cat-tag text-decoration-none">{cat.name}</Link>)}</div></div>}
  </>}
 {showEnquiry&&product&&<ProductEnquiryModal product={product} quantity={quoteQty} unit={quoteUnit} onClose={()=>setShowEnquiry(false)}/>}
 {showReview&&product&&<ProductReviewModal product={product} onClose={()=>setShowReview(false)} onSubmitted={()=>{apiFetch<Product>(`products/details/${encodeURIComponent(slug)}`).then(setProduct).catch(()=>{});}}/>}
 </div></section>;
}
