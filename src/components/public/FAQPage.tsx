"use client";
import {useEffect,useState} from "react";
import {FaChevronDown,FaChevronUp} from "react-icons/fa";
import {apiFetch} from "@/lib/api";
import "@/legacy-assets/css/faq-page.css";

type Category = {id: string | number; name: string};
type FAQ = {id: string | number; title: string; description: string; category: string | number};
function textOnly(html: string) { return html.replace(/<br\s*\/?\s*>/gi,"\n").replace(/<\/p\s*>/gi,"\n").replace(/<[^>]*>/g, ""); }
export default function FAQPage(){
 const [categories,setCategories]=useState<Category[]>([]);
 const [faqs,setFaqs]=useState<FAQ[]>([]);
 const [activeTab,setActiveTab]=useState("all");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;(async()=>{try{
 const [catData,faqData]=await Promise.all([apiFetch<unknown>("faqcategories"),apiFetch<unknown>("faqs")]);
 if(active){setCategories(Array.isArray(catData)?catData:[]);setFaqs(Array.isArray(faqData)?faqData:[]);}
 }catch{if(active)setError("Failed to load FAQs.");}finally{if(active)setLoading(false);}})();return()=>{active=false};},[]);
 const filtered=activeTab==="all"?faqs:faqs.filter(f=>String(f.category)===activeTab);
 const tabs=categories.filter(c=>faqs.some(f=>String(f.category)===String(c.id)));
 return <div className="faq-page-container my-4">
 <h1 className="faq-title">Frequently Asked Questions</h1>
 <div className="faq-tabs styled"><button className={activeTab==="all"?"active":""} onClick={()=>setActiveTab("all")}>All</button>
 {tabs.map(c=><button key={c.id} className={activeTab===String(c.id)?"active":""} onClick={()=>setActiveTab(String(c.id))}>{c.name}</button>)}</div>
 <div className="faq-content">{loading?<div className="faq-loading">Loading...</div>:error?<div className="faq-error">{error}</div>:filtered.length===0?<div className="faq-empty">No FAQs found for this category.</div>:<Accordion key={activeTab} faqs={filtered}/>}</div>
 </div>;
}
function Accordion({faqs}:{faqs:FAQ[]}){
 const [open,setOpen]=useState<string|number|null>(null);
 return <div className="faq-accordion modern">{faqs.map(f=><div className={`faq-item modern${open===f.id?" open":""}`} key={f.id}>
 <button type="button" className="faq-question-row w-100 border-0 bg-transparent text-start" aria-expanded={open===f.id} onClick={()=>setOpen(open===f.id?null:f.id)}><span className="faq-question-text">{f.title}</span><span className="faq-icon">{open===f.id?<FaChevronUp/>:<FaChevronDown/>}</span></button>
 <div className={`faq-answer${open===f.id?" show":""}`} aria-hidden={open!==f.id} style={{maxHeight:open===f.id?"500px":"0",opacity:open===f.id?1:0,padding:open===f.id?"1rem":"0 1rem",whiteSpace:"pre-line"}}>{textOnly(f.description??"")}</div>
 </div>)}</div>;
}
