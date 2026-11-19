"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import {getApiBaseUrl} from "@/lib/api";

type Feedback = "yes"|"no"|null;
type ReviewResponse={success?:number|boolean;message?:string;error?:string};
type Props={product:{id?:number;title?:string;company_id?:number;company_name?:string};onClose:()=>void;onSubmitted:()=>void};
const labels=["","Poor","Fair","Good","Very Good","Excellent"];
const feedbackFields=["Response","Quality","Delivery"] as const;

export default function ProductReviewModal({product,onClose,onSubmitted}:Props){
 const router=useRouter();
 const {user,isLoggedIn,loadingUser}=useAuth();
 const [rating,setRating]=useState(0);
 const [hover,setHover]=useState(0);
 const [review,setReview]=useState("");
 const [feedback,setFeedback]=useState<Record<string,Feedback>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{closeRef.current?.focus();},[]);
 useEffect(()=>{
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!busy)onClose();};
  window.addEventListener("keydown",onKeyDown);
  return()=>window.removeEventListener("keydown",onKeyDown);
 },[busy,onClose]);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy||success)return;
  setError("");
  if(loadingUser){setError("Checking your login session. Please try again.");return;}
  const userId=Number(user?.id);
  if(!isLoggedIn||!Number.isSafeInteger(userId)||userId<=0){
   setError("Please log in to submit a review.");
   router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
   return;
  }
  if(!product.id||!product.company_id){setError("Product or company information is unavailable.");return;}
  if(rating<1||rating>5){setError("Please select a star rating.");return;}
  if(review.trim().length<20){setError("Please write at least 20 characters.");return;}
  const base=getApiBaseUrl();
  if(!base){setError("API URL is not configured.");return;}
  setBusy(true);
  try{
   // Original React contract: only rating and review are persisted.
   // Response/Quality/Delivery controls are UI-only in the source project.
   const response=await fetch(`${base}/products/company-review`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({product_id:product.id,company_id:product.company_id,user_id:userId,rating,review:review.trim()})
   });
   const data:ReviewResponse=await response.json().catch(()=>({}));
   if(!response.ok||!(data.success===1||data.success===true)){
    throw new Error(data.message||data.error||`Review could not be submitted (${response.status}).`);
   }
   setSuccess(data.message||"Review submitted successfully.");
   onSubmitted();
  }catch(e){setError(e instanceof Error?e.message:"Review could not be submitted.");}
  finally{setBusy(false);}
 };
 return <div className="pd-rm-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
  <div className="pd-rm-dialog" role="dialog" aria-modal="true" aria-labelledby="pd-review-title" aria-describedby="pd-review-description">
   <div className="pd-rm-modal">
    <div className="pd-rm-head">
     <div className="pd-rm-head-icon" aria-hidden="true"><i className="bx bxs-star"/></div>
     <div className="pd-rm-head-text"><p className="pd-rm-head-label">Rate your Experience with</p><h2 id="pd-review-title" className="pd-rm-head-company">{product.company_name||"Seller"}</h2></div>
     <button ref={closeRef} type="button" className="pd-rm-x" onClick={onClose} disabled={busy} aria-label="Close review form">✕</button>
    </div>
    <div id="pd-review-description" className="pd-rm-subheader"><i className="bx bx-info-circle me-1" aria-hidden="true"/>To submit your ratings, please provide the following information</div>
    <div className="pd-rm-body">
     {error&&<div className="alert alert-danger" role="alert">{error}</div>}
     {success?<div role="status"><div className="alert alert-success">{success}</div><button type="button" className="pd-rm-submit" onClick={onClose}>Close</button></div>:
     <form onSubmit={submit}>
      <div className="pd-rm-field"><label className="pd-rm-label" htmlFor="pd-review-product">Select product / service</label><select id="pd-review-product" className="pd-rm-select form-select" value={product.id||""} disabled><option value={product.id||""}>{product.title||"Product"}</option></select></div>
      <div className="pd-rm-field"><span className="pd-rm-label" id="pd-review-rating-label">Your Rating</span>
       <div className="pd-rm-stars" role="group" aria-labelledby="pd-review-rating-label">
        {[1,2,3,4,5].map(value=><button type="button" key={value} className={`pd-rm-star${value<=(hover||rating)?" active":""}`} style={{border:0,background:"transparent",padding:0}} onClick={()=>setRating(value)} onMouseEnter={()=>setHover(value)} onMouseLeave={()=>setHover(0)} onFocus={()=>setHover(value)} onBlur={()=>setHover(0)} aria-label={`${value} out of 5 stars`} aria-pressed={rating===value}>★</button>)}
        {rating>0&&<span className="pd-rm-rating-text">{labels[rating]}</span>}
       </div>
      </div>
      <div className="pd-rm-field"><span className="pd-rm-label">What did you Like?</span>
       <div className="pd-rm-like-row">{feedbackFields.map(field=><div key={field} className="pd-rm-like-group"><span className="pd-rm-like-label">{field}</span><div className="pd-rm-like-btns">{(["yes","no"] as const).map(choice=><button key={choice} type="button" className={`pd-rm-like-btn ${choice=== "yes"?"like":"dislike"}${feedback[field]===choice?" selected":""}`} aria-pressed={feedback[field]===choice} onClick={()=>setFeedback(previous=>({...previous,[field]:previous[field]===choice?null:choice}))}><i className={`bx ${choice==="yes"?"bx-like":"bx-dislike"}`} aria-hidden="true"/>{choice==="yes"?"Yes":"No"}</button>)}</div></div>)}</div>
       <small className="text-muted">These preferences are not stored by the current review API.</small>
      </div>
      <div className="pd-rm-field"><label htmlFor="pd-review-text" className="pd-rm-label">Write your Review</label><textarea id="pd-review-text" className="pd-rm-textarea" rows={4} placeholder="Share your experience in detail... (minimum 20 characters)" value={review} onChange={e=>setReview(e.target.value)} minLength={20} required/><span className="pd-rm-char-count">{review.length} / 20 min</span></div>
      <button type="submit" className="pd-rm-submit" disabled={busy||loadingUser}>{busy?"Submitting...":"Submit Review"}</button>
     </form>}
    </div>
   </div>
  </div>
 </div>;
}
