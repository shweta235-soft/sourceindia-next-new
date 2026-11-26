/** Express legacy `/v2/api/location` read-only response adapter.
 * No modification to original backend. MySQL queries are parameterized.
 * PIN provider uses strict HTTPS verification (original Express disabled TLS verification).
 */
import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {locationPathId} from '@/lib/localLocationCatalog';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export type LocationResource='countries'|'states'|'cities';
const resources={
 countries:'SELECT country_id AS id, uuid, sortname, name, phonecode FROM countries ORDER BY country_id ASC',
 states:'SELECT state_id AS id, uuid, name, country_id FROM states ORDER BY state_id ASC',
 cities:'SELECT city_id AS id, uuid, name, state_id FROM cities ORDER BY city_id ASC'
};
export async function bulk115AllLocations(resource:LocationResource){
 const db=localAccountDatabase();if(!db)return reply({error:'Local database unavailable'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>(resources[resource]);return reply(rows);}catch{return reply({error:'Location lookup unavailable'},503);}
}
export async function bulk115ByState(raw:string){
 const id=locationPathId(raw);if(id===null)return reply({error:'state_id is required'},400);
 const db=localAccountDatabase();if(!db)return reply({error:'Local database unavailable'},503);
 try{const [rows]=await db.execute<RowDataPacket[]>('SELECT city_id AS id,uuid,name,state_id FROM cities WHERE state_id = ? ORDER BY city_id ASC',[id]);return reply(rows);}catch{return reply({error:'Cities lookup unavailable'},503);}
}
const filterKeys=['category_ids','subcategory_ids','item_category_ids','item_subcategory_ids'] as const;
export function parseLegacyStateFilters(url:string){
 const q=new URL(url).searchParams;
 if([...q.keys()].some(k=>!filterKeys.includes(k as typeof filterKeys[number])||q.getAll(k).length>1))return null;
 const o:Record<string,number[]>={};
 for(const k of filterKeys){
  const input=q.get(k);if(input===null)continue;
  const values=input.split(',');
  if(values.length<1||values.length>30||values.some(x=>locationPathId(x)===null))return null;
  o[k]=[...new Set(values.map(Number))];
 }
 return o;
}
export async function bulk115StatesForCountry(req:Request,raw:string){
 const country=locationPathId(raw),filters=parseLegacyStateFilters(req.url);
 if(country===null||filters===null)return reply({error:'Invalid country or location filters'},400);
 const db=localAccountDatabase();if(!db)return reply({error:'Local database unavailable'},503);
 try{
  const [states]=await db.execute<RowDataPacket[]>('SELECT state_id AS id,uuid,name,country_id FROM states WHERE country_id = ? ORDER BY state_id ASC',[country]);
  const conditions=['u.country = ?','u.status = 1','u.is_approve = 1','u.is_delete = 0','p.status = 1','p.is_approve = 1','p.is_delete = 0'];
  const values:(number|string)[]=[country];
  for(const [k,col] of [['category_ids','p.category'],['subcategory_ids','p.sub_category'],['item_category_ids','p.item_category_id'],['item_subcategory_ids','p.item_subcategory_id']] as const){
   if(filters[k]){conditions.push(`${col} IN (${filters[k].map(()=>'?').join(',')})`);values.push(...filters[k]);}
  }
  const [productCounts]=await db.execute<RowDataPacket[]>(`SELECT u.state AS id,COUNT(p.product_id) AS total FROM products p INNER JOIN users u ON u.user_id = p.user_id WHERE ${conditions.join(' AND ')} GROUP BY u.state`,values);
  const [companyCounts]=await db.execute<RowDataPacket[]>(`SELECT u.state AS id, COUNT(DISTINCT u.company_id) AS total FROM users u JOIN company_info ci ON ci.company_id = u.company_id WHERE u.country = ? AND u.company_id IS NOT NULL AND u.is_delete = 0 AND u.is_approve = 1 AND u.status = 1 AND u.is_seller = 1 AND ci.is_delete = 0 GROUP BY u.state`,[country]);
  const productMap=new Map(productCounts.map(r=>[Number(r.id),Number(r.total)]));
  const companyMap=new Map(companyCounts.map(r=>[Number(r.id),Number(r.total)]));
  return reply(states.map(r=>({...r,product_count:productMap.get(Number(r.id))??0,company_count:companyMap.get(Number(r.id))??0})));
 }catch{return reply({error:'State and company counts unavailable'},503);}
}
/** External API availability is not guaranteed. Only six decimal digits accepted.
 * Fixes insecure TLS verification configuration in original Express implementation.
 */
export async function bulk115Pincode(raw:string){
 if(!/^\d{6}$/.test(raw))return reply({error:'Invalid pincode format'},400);
 try{
  const res=await fetch(`https://api.postalpincode.in/pincode/${raw}`,{signal:AbortSignal.timeout(7000),cache:'no-store',redirect:'error'});
  if(!res.ok||!/^application\/json/i.test(res.headers.get('content-type')??''))return reply({error:'Failed to fetch pincode data'},502);
  const data:unknown=await res.json();
  if(!Array.isArray(data))return reply({error:'Invalid postal response'},502);
  return reply(data);
 }catch{return reply({error:'Failed to fetch pincode data'},502);}
}
