"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api";

type PageData={title?:string;description?:string};
type PageResponse={data?:PageData}&PageData;
export default function LegalContentPage({pageId}:{pageId:8|9}){
 const [page,setPage]=useState<PageData|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;setLoading(true);setError("");
 apiFetch<PageResponse>(`/pages/${pageId}`).then(result=>{if(active)setPage(result.data??result);}).catch(()=>{if(active)setError("Failed to load page data.");}).finally(()=>{if(active)setLoading(false);});
 return ()=>{active=false;};},[pageId]);
 if(loading)return <div className="container my-5 text-center">Loading...</div>;
 if(error)return <div className="container my-5 text-center text-danger" role="alert">{error}</div>;
 return <div className="container-xxl my-5"><div className="card mb-lg-5 mb-3 commonHead border shadow-none"><div className="card-body py-5 text-center"><h1 className="text-white">{page?.title??""}</h1></div></div><div className="card"><div className="card-body p-4"><div className="legal-page-content" dangerouslySetInnerHTML={{__html:page?.description??""}} /></div></div></div>;
}
