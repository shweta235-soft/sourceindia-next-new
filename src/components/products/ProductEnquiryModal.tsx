"use client";
import {useState,type FormEvent} from "react";
import {getApiBaseUrl} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import {assetUrl} from "@/lib/asset";

type ProductInfo={id?:number;title?:string;file_name?:string;company_id?:number;company_name?:string};
type Props={product:ProductInfo;quantity?:string;unit?:string;onClose:()=>void};
async function post(path:string,body:Record<string,unknown>){
 const base=getApiBaseUrl();
 if(!base)throw new Error("API URL is not configured");
 const response=await fetch(`${base}/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result?.success===false)throw new Error(result?.message||result?.error||`Request failed (${response.status})`);
 return result;
}
export default function ProductEnquiryModal({product,quantity="",unit="Piece",onClose}:Props){
 const {user,login}=useAuth();
 const userId=user?.id;
 const alreadyLoggedIn=Boolean(userId&&user?.walkin_buyer!==1);
 const [step,setStep]=useState(alreadyLoggedIn?3:1);
 const [email,setEmail]=useState("");const [otp,setOtp]=useState("");
 const [verifiedId,setVerifiedId]=useState<number|string|null>(null);
 const [name,setName]=useState(String(user?.fname||""));
 const [company,setCompany]=useState(String(user?.company_info?.organization_name||""));
 const [phone,setPhone]=useState("");
 const [qty,setQty]=useState(quantity);const [selectedUnit,setSelectedUnit]=useState(unit);const [description,setDescription]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setError("");setMessage("");try{await action()}catch(e){setError(e instanceof Error?e.message:"Request failed")}finally{setBusy(false)}};
 const requestOtp=(e:FormEvent)=>{e.preventDefault();void run(async()=>{if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter a valid email address");await post("enquiries/verify",{email});setStep(2);setMessage("OTP sent to your email.")})};
 const resend=()=>void run(async()=>{await post("enquiries/resend-otp",{email});setMessage("OTP resent.")});
 const verify=(e:FormEvent)=>{e.preventDefault();void run(async()=>{const data=await post("enquiries/submit-otp",{email,otp});if(!data?.verified||!data?.token||!data?.user?.id)throw new Error("OTP verification could not be completed");setVerifiedId(data.user.id);login(data.token);setStep(3);setMessage("Email verified.")})};
 const submit=(e:FormEvent)=>{e.preventDefault();void run(async()=>{
  if(!product.id)throw new Error("Product ID unavailable");
  if(!/^\d+(?:\.\d+)?$/.test(qty.trim())||Number(qty)<=0)throw new Error("Enter a valid quantity");
  const enquiryDescription=`Quantity unit: ${selectedUnit.trim()}${description.trim()?`\n${description.trim()}`:""}`;
  if(!selectedUnit.trim())throw new Error("Enter a unit");
  if(alreadyLoggedIn){
   await post("enquiries/user-submit-enquiry",{userId,quantity:qty,description:enquiryDescription,product_id:product.id,enq_company_id:product.company_id});
  }else{
   if(!verifiedId)throw new Error("Verify your email first");
   if(!/^[6-9]\d{9}$/.test(phone.trim()))throw new Error("Enter a valid 10-digit mobile number");
   await post("enquiries/store",{userId:verifiedId,name,company,phone,quantity:qty,description:enquiryDescription,product_id:product.id,enq_company_id:product.company_id});
  }
  setStep(4);setMessage("Enquiry submitted successfully.");
 })};
 return <div className="modal show d-block" role="dialog" aria-modal="true" aria-label="Send Inquiry" style={{background:"rgba(0,0,0,.55)",zIndex:1060}}>
  <div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content">
   <div className="modal-header"><h2 className="modal-title h5">Send Inquiry</h2><button type="button" className="btn-close" aria-label="Close" onClick={onClose}/></div>
   <div className="modal-body"><div className="row g-3">
    <div className="col-md-5 bg-light p-3"><img src={assetUrl(product.file_name)} alt={product.title||"Product"} className="img-fluid rounded mb-3" style={{maxHeight:220,objectFit:"contain"}}/><h3 className="h6">{product.title}</h3><p className="text-muted">{product.company_name}</p></div>
    <div className="col-md-7 p-3">
     {error&&<div className="alert alert-danger" role="alert">{error}</div>}
     {message&&<div className="alert alert-success" role="status">{message}</div>}
     {step===1&&<form onSubmit={requestOtp}><label className="form-label" htmlFor="enq-email">Email address</label><input id="enq-email" type="email" required className="form-control mb-3" value={email} onChange={e=>setEmail(e.target.value)}/><button className="btn btn-primary" disabled={busy}>{busy?"Sending...":"Send OTP"}</button></form>}
     {step===2&&<form onSubmit={verify}><label htmlFor="enq-otp" className="form-label">Email OTP</label><input id="enq-otp" required className="form-control mb-3" value={otp} onChange={e=>setOtp(e.target.value)}/><div className="d-flex gap-2"><button className="btn btn-primary" disabled={busy}>Verify OTP</button><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={resend}>Resend OTP</button></div></form>}
     {step===3&&<form onSubmit={submit}>
      {!alreadyLoggedIn&&<><label className="form-label" htmlFor="enq-name">Name</label><input id="enq-name" className="form-control mb-2" required value={name} onChange={e=>setName(e.target.value)}/><label className="form-label" htmlFor="enq-company">Company</label><input id="enq-company" className="form-control mb-2" value={company} onChange={e=>setCompany(e.target.value)}/><label className="form-label" htmlFor="enq-phone">Mobile number</label><input id="enq-phone" className="form-control mb-2" required inputMode="numeric" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value)}/></>}
      <label className="form-label" htmlFor="enq-qty">Quantity</label><input id="enq-qty" className="form-control mb-2" required type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/>
      <label className="form-label" htmlFor="enq-unit">Unit</label><input id="enq-unit" className="form-control mb-2" required maxLength={40} value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)}/>
      <label className="form-label" htmlFor="enq-description">Message</label><textarea id="enq-description" className="form-control mb-3" rows={4} value={description} onChange={e=>setDescription(e.target.value)}/>
      <button className="btn btn-primary" disabled={busy}>{busy?"Submitting...":"Submit Enquiry"}</button>
     </form>}
     {step===4&&<button type="button" className="btn btn-primary" onClick={onClose}>Close</button>}
    </div></div></div>
  </div></div>
 </div>;
}
