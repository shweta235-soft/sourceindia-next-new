"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";

type KnowledgeItem = {
  id?: number | string;
  name?: string;
  file_name?: string | null;
  video_url?: string | null;
  is_delete?: number | string;
  status?: number | string;
};

export default function KnowledgeCenterPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<KnowledgeItem[]>("/knowledge_center")
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = items.filter((item) => Number(item.is_delete) === 0 && Number(item.status) === 1);
  return (
    <section className="my-5">
      <div className="container-xxl">
        <div className="card mb-lg-5 mb-3 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">Knowledge sessions for the Electronics Industry</h1>
            </div>
          </div>
        </div>
        <div className="knowledgeBox">
          {loading ? <p role="status">Loading knowledge sessions...</p> :
           error ? <p role="alert">Unable to load knowledge sessions. Please try again later.</p> :
           visible.length === 0 ? <p>No knowledge sessions available.</p> :
           <div className="row">
             {visible.map((item, index) => (
               <div className="col-lg-4 col-sm-6 mb-4 d-flex" key={item.id ?? index}>
                 <div className="ContentBox bg-white shadow-sm border w-100 d-flex flex-column rounded-2">
                   <div className="innervideo text-center p-3 pb-0">
                     <img src={assetUrl(item.file_name)} width={180} height={180} alt={item.name || "Knowledge session"} loading="lazy"
                       style={{maxWidth:"100%",objectFit:"contain"}} onError={(e)=>{e.currentTarget.src="/default.png";}} />
                   </div>
                   <div className="videobox d-flex flex-column flex-grow-1">
                     <div className="p-3 d-flex flex-column flex-grow-1">
                       <p className="flex-grow-1">{item.name}</p>
                       {item.video_url ? <a href={item.video_url} className="btn btn-sm btn-primary w-100 mt-auto" target="_blank" rel="noopener noreferrer">View ➜</a> :
                         <span className="btn btn-sm btn-secondary w-100 mt-auto disabled">Video unavailable</span>}
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>}
        </div>
      </div>
    </section>
  );
}
