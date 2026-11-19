"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {apiFetch} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
type Props={companyId?:number;companyName:string;receiverName?:string;onClose:()=>void};
export default function CompanyConnectModal({companyId,companyName,receiverName,onClose}:Props){
 const {user}=useAuth();
 const [title,setTitle]=useState("");const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState(false);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current)},[]);
 function handleClose(){if(closeTimer.current)clearTimeout(closeTimer.current);setTitle("");setMessage("");onClose()}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(loading||success)return;
  if(!title.trim()||!message.trim()){setError("Please fill all fields");return}
  if(!user?.id||!companyId){setError("Company or login information is unavailable.");return}
  setLoading(true);setError("");
  try{
   await apiFetch("/enquiries/send-message-connect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({logged_in_user_id:user.id,company_id:companyId,title,message,receiver_name:receiverName})});
   setSuccess(true);closeTimer.current=setTimeout(handleClose,1000);
  }catch{setError("Error sending message")}finally{setLoading(false)}
 }
 return <div className="modal fade show" id="enquiryModal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="enquiryModalLabel" style={{display:"block",backgroundColor:"#0606068c",zIndex:1060}}>
  <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
   <div className="modal-header justify-content-between"><h5 className="modal-title" id="enquiryModalLabel">Connect with {companyName||"Company"}</h5><button type="button" className="close btn" onClick={handleClose} aria-label="Close"><span aria-hidden="true"><i className="bx bx-x"/></span></button></div>
   <form onSubmit={submit}><div className="modal-body">
    {error&&<div className="alert alert-danger" role="alert">{error}</div>}
    {success&&<div className="alert alert-success" role="status">Message sent!</div>}
    <div className="form-group mb-3"><label htmlFor="connect-title">Title <sup className="text-danger">*</sup></label><input type="text" id="connect-title" className="form-control" value={title} onChange={e=>setTitle(e.target.value)} required disabled={loading||success}/></div>
    <div className="form-group mb-3"><label htmlFor="connect-message">Message <sup className="text-danger">*</sup></label><textarea id="connect-message" className="form-control" rows={4} style={{height:"80px"}} value={message} onChange={e=>setMessage(e.target.value)} required disabled={loading||success}/></div>
   </div><div className="modal-footer"><button type="submit" className="btn btn-primary" disabled={loading||success}>{loading?<span className="spinner-border spinner-border-sm" role="status" aria-label="Sending"/>:"Send"}</button><button type="button" className="btn btn-danger" onClick={handleClose}>Close</button></div></form>
  </div></div>
 </div>
}
