"use client";
import {useEffect,useMemo,useState} from "react";
import {apiFetch} from "@/lib/api";
import "@/legacy-assets/css/subscription-plans.css";

type Plan={id?:number|string;name?:string;elcina_plan?:number|string;price?:number|string;enquiries?:number|string;category?:number|string;product?:number|string;expire_days?:number|string};
type Group=Plan & {memberPrice:number|null;nonMemberPrice:number|null};
export default function SubscriptionPlans(){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{let active=true;apiFetch<unknown>("membership_plans?is_delete=0").then(data=>{if(active)setPlans(Array.isArray(data)?data:[])}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const grouped=useMemo(()=>{const map=new Map<string,Group>();for(const plan of plans){const name=String(plan.name??"");if(!map.has(name))map.set(name,{...plan,memberPrice:null,nonMemberPrice:null});const item=map.get(name)!;if(String(plan.elcina_plan)==="1")item.memberPrice=Number(plan.price??0);else item.nonMemberPrice=Number(plan.price??0)}return [...map.values()]},[plans]);
 return <section className="my-5"><div className="container"><div className="card mb-5 commonHead border shodow-none"><div className="card-body py-5 d-flex align-items-center justify-content-center"><div className="firstHead text-center"><h1 className="mb-0 text-white">Elcina Portal Subscription Plans</h1></div></div></div><div className="planBox"><div className="row"><div className="col-lg-12 mx-auto"><div className="card"><div className="card-body p-5"><div className="table-responsive overflow-x-auto"><table className="table table-bordered m-auto w-100"><thead><tr><th>Plan Name</th><th colSpan={3}>Features</th><th rowSpan={2}>Validity</th><th colSpan={2}>Price(Excluding GST)</th></tr><tr className="second_row"><th></th><th>No. of Enquiries</th><th>Product Categories</th><th>No. of Product</th><th>Member</th><th>Non-Member</th></tr></thead><tbody>{loading?<tr><td colSpan={7}>Loading plans...</td></tr>:error?<tr><td colSpan={7}>Unable to load subscription plans.</td></tr>:grouped.length===0?<tr><td colSpan={7}>No plans available.</td></tr>:grouped.map(plan=><tr key={String(plan.name)}><td className="text-start">{plan.name}</td><td>{plan.enquiries}</td><td>{plan.category}</td><td>{plan.product}</td><td>{Number(plan.expire_days)===365?"1 Year":`${plan.expire_days} Days`}</td>{([plan.memberPrice,plan.nonMemberPrice] as const).map((price,i)=><td key={i}>{price&&price>0?<div className="planpart"><img src="/scroll-down.gif" alt="" className="gif_left"/> ₹{price} <button type="button" className="continuebtn" disabled title="Subscription checkout is not available in the original public page">Continue</button></div>:"0"}</td>)}</tr>)}</tbody></table></div></div></div></div></div></div></div></section>
}
