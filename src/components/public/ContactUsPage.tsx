"use client";
import {useState,type FormEvent} from "react";
import {useSiteSettings} from "@/context/SiteSettingsContext";
import {apiFetch} from "@/lib/api";
type Fields={fname:string;lname:string;email:string;subject:string;message:string};
const empty:Fields={fname:"",lname:"",email:"",subject:"",message:""};
export default function ContactUsPage(){
 const {siteSettings,loading}=useSiteSettings();
 const [fields,setFields]=useState<Fields>(empty);
 const [errors,setErrors]=useState<Partial<Record<keyof Fields,string>>>({});
 const [sending,setSending]=useState(false);
 const [notice,setNotice]=useState("");
 const settings=siteSettings?.home_settings;
 const change=(name:keyof Fields,value:string)=>{setFields(prev=>({...prev,[name]:value}));setErrors(prev=>({...prev,[name]:""}))};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setNotice("");
  const next:Partial<Record<keyof Fields,string>>={};
  for(const name of Object.keys(fields) as (keyof Fields)[])if(!fields[name].trim())next[name]=`${name==="fname"?"First name":name==="lname"?"Last name":name.charAt(0).toUpperCase()+name.slice(1)} is required.`;
  if(fields.email.trim()&&!/\S+@\S+\.\S+/.test(fields.email))next.email="Enter a valid email address.";
  if(Object.keys(next).length){setErrors(next);return}
  setSending(true);
  try{await apiFetch("/contacts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(fields)});setFields(empty);setErrors({});setNotice("Your message has been sent successfully!")}
  catch{setNotice("Something went wrong. Please try again later.")}
  finally{setSending(false)}
 }
 return <section className="my-5"><div className="container-xxl">
  <div className="card mb-lg-5 mb-3 commonHead border shodow-none"><div className="card-body py-5 d-flex align-items-center justify-content-center"><div className="firstHead text-center"><h1 className="mb-0 text-white">LET&apos;S CONNECT</h1></div></div></div>
  <div className="knowledgeBox"><div className="card"><div className="card-body"><div className="row">
   <div className="col-xl-4 col-md-6 mb-xl-0 mb-5"><div className="iframeBox h-100">{settings?.contact_map_url?<iframe src={settings.contact_map_url} title="Our location" loading="lazy" className="w-100 h-100" style={{minHeight:320}} referrerPolicy="no-referrer-when-downgrade"/>:<div className="h-100 bg-light" style={{minHeight:320}}/>}</div></div>
   <div className="col-xl-3 col-md-6 mb-xl-0 mb-5"><div className="contact-info ps-lg-3 pe-lg-3 border-end h-100"><h2>MEET US</h2>
    <div className="info-item d-flex align-items-start mt-4"><div><h6 className="text-orange">Call Us Now</h6>{[settings?.contactphone_1,settings?.contactphone_2].filter(Boolean).map((phone,i)=><p key={i}><a className="nav-link" href={`tel:${phone}`}>{phone}</a></p>)}</div></div>
    <div className="info-item d-flex align-items-start"><div><h6 className="text-orange">Our Location</h6><div>{settings?.contactaddress?.replace(/<[^>]*>/g," ")}</div></div></div>
    <div className="info-item d-flex align-items-start"><div><h6 className="text-orange">Write Us Now</h6><a href={`mailto:${settings?.contactemail||""}`}>{settings?.contactemail}</a></div></div>
   </div></div>
   <div className="col-xl-5 col-md-8 mx-auto"><div className="contact-form"><h2 className="mb-4">HAVE A QUESTION?</h2>
    <form onSubmit={submit} noValidate><div className="row">{(["fname","lname","email","subject","message"] as (keyof Fields)[]).map(name=><div key={name} className={`${name==="fname"||name==="lname"?"col-md-6":"col-md-12"} p-2`}><div className="form-group">{name==="message"?<textarea name={name} rows={6} placeholder="Your Message*" value={fields[name]} onChange={e=>change(name,e.target.value)} className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors[name]?"is-invalid":""}`}/>:<input type={name==="email"?"email":"text"} name={name} placeholder={({fname:"Your First Name*",lname:"Your Last Name*",email:"Your Email*",subject:"Your Subject*",message:"Your Message*"})[name]} value={fields[name]} onChange={e=>change(name,e.target.value)} className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors[name]?"is-invalid":""}`}/>}
    {errors[name]&&<small className="text-danger">{errors[name]}</small>}</div></div>)}<div className="col-md-12 text-center pt-3"><button type="submit" disabled={sending||loading} className="btn btn-primary w-100 si-contact-submit">{sending?"Sending...":"Submit Now"}</button>{notice&&<p className="mt-3" role="status">{notice}</p>}</div></div></form>
   </div></div>
  </div></div></div></div></div></section>
}
