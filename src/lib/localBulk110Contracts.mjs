/** Pure read-only validation/formatting for Bulk110 Seller/Buyer analytics.
 * Requests cannot select SQL identifiers, request an unbounded date range,
 * or pass arbitrary user ids to lookup queries.
 */
export const BULK110_MODULES=Object.freeze(['sellers','buyers']);
export const BULK110_OPERATIONS=Object.freeze(['trends','chart','seller-categories','seller-subcategories','seller-subcategories-by-user','with-messages','seller-message','designations','nature_business','get-buyer-sourcing-interests']);
export function bulk110Id(value){
 if(typeof value!=='string'||!/^[1-9]\d{0,14}$/.test(value))return null;
 const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;
}
export function bulk110Flag(value){return value===null?null:value==='0'?0:value==='1'?1:undefined;}
export function bulk110Only(params,allowed){
 const seen=new Set();
 for(const key of params.keys()){
  if(!allowed.includes(key)||seen.has(key))return false;
  seen.add(key);
 }
 return true;
}
const DAY=86400000;
function formatDate(d){return d.toISOString().slice(0,10);}
function parseDate(raw){
 if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
 const date=new Date(raw+'T00:00:00.000Z');
 return Number.isFinite(date.valueOf())&&formatDate(date)===raw?date:null;
}
function monthStart(d){return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1));}
function yearStart(d){return new Date(Date.UTC(d.getUTCFullYear(),0,1));}
function add(d,period,n=1){
 if(period==='day')return new Date(d.valueOf()+DAY*n);
 if(period==='month')return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1));
 return new Date(Date.UTC(d.getUTCFullYear()+n,0,1));
}
export function bulk110Key(date,period){const s=formatDate(date);return period==='day'?s:period==='month'?s.slice(0,7):s.slice(0,4);}
export function bulk110Series(params,mode,now=new Date()){
 const allowed=mode==='chart'?['startDate','endDate','type']:['period','from','to'];
 if(!bulk110Only(params,allowed))return null;
 const period=mode==='chart'?'day':(params.get('period')||'day');
 if(!['day','month','year'].includes(period))return null;
 const type=params.get('type');
 if(mode==='chart'&&type!==null&&type!=='ALLACTIVE')return null;
 const fromRaw=mode==='chart'?params.get('startDate'):params.get('from');
 const toRaw=mode==='chart'?params.get('endDate'):params.get('to');
 if((fromRaw===null)!==(toRaw===null))return null;
 const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 let from=fromRaw!==null?parseDate(fromRaw):null;
 let to=toRaw!==null?parseDate(toRaw):null;
 if(fromRaw!==null&&(!from||!to))return null;
 if(!from||!to){
  to=today;
  const points=period==='day'?30:period==='month'?12:5;
  from=add(period==='day'?today:period==='month'?monthStart(today):yearStart(today),period,-(points-1));
 }
 if(from>to||to.valueOf()>today.valueOf()+DAY*30)return null;
 const start=period==='day'?from:period==='month'?monthStart(from):yearStart(from);
 const last=period==='day'?to:period==='month'?monthStart(to):yearStart(to);
 const keys=[];
 for(let date=start;date<=last;date=add(date,period)){
  keys.push(bulk110Key(date,period));
  if(keys.length>366)return null;
 }
 if(period==='month'&&keys.length>36||period==='year'&&keys.length>12)return null;
 return {period,keys,from:formatDate(from),to:formatDate(to),
  fromSql:formatDate(from)+' 00:00:00',
  endSql:formatDate(new Date(to.valueOf()+DAY))+' 00:00:00',
  format:period==='day'?'%Y-%m-%d':period==='month'?'%Y-%m':'%Y',type};
}
export function bulk110Totals(kind,rows,series){
 const lookup=new Map(rows.map(row=>[String(row.date),row]));
 return series.keys.map(date=>{
  const row=lookup.get(date)||{};
  const entry={date,Active:Number(row.active||0),Inactive:Number(row.inactive||0),NotApproved:Number(row.notApproved||0),Deleted:Number(row.deleted||0)};
  if(kind==='sellers')entry.NotCompleted=Number(row.notCompleted||0);
  return {...entry,Total:Object.entries(entry).filter(([key])=>key!=='date').reduce((sum,[,value])=>sum+value,0)};
 });
}
export function bulk110Trend(kind,rows,series){
 const data=bulk110Totals(kind,rows,series);
 const names=kind==='sellers'?['active','inactive','notApproved','notCompleted']:['active','inactive','notApproved'];
 const result={period:series.period,from:series.from,to:series.to};
 for(const name of names){const output={};for(const row of data){const column={active:'Active',inactive:'Inactive',notApproved:'NotApproved',notCompleted:'NotCompleted'}[name];output[row.date]=row[column];}result[name]=output;}
 return result;
}
export function bulk110GroupSourcing(rows){
 const output=new Map();
 for(const row of rows){
  const categoryId=Number(row.item_category_id);
  if(!Number.isSafeInteger(categoryId)||categoryId<1)continue;
  if(!output.has(categoryId))output.set(categoryId,{category_id:categoryId,category_name:String(row.category_name||''),subcategories:[]});
  const subId=row.item_subcategory_id==null?null:Number(row.item_subcategory_id);
  if(Number.isSafeInteger(subId)&&subId>0){
   const list=output.get(categoryId).subcategories;
   if(!list.some(item=>item.id===subId))list.push({id:subId,name:String(row.subcategory_name||'')});
  }
 }
 return [...output.values()];
}
