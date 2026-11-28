/** BULK121: Role-scoped read access to tickets.
 * The public /v2/api/tickets routes cannot rely on a browser's Path=/admin cookie;
 * the admin-facing alias lives beneath /admin/api/local/tickets/legacy-grid.
 * This module never changes data or returns ticket tracker tokens.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {adminSessionCookie,readAdminSession} from '@/lib/adminSession';

const send=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const validPositive=(value:string)=>/^[1-9]\d{0,14}$/.test(value)&&Number.isSafeInteger(Number(value));
export type TicketScope={adminId:number,all:boolean,category:number|null};
export type TicketScopeResult={scope:TicketScope}|{error:Response};
export async function ticketAdminScope(req:NextRequest):Promise<TicketScopeResult>{
 const session=readAdminSession(req.cookies.get(adminSessionCookie)?.value);
 if(!session || !validPositive(session.id))return {error:send({message:'Unauthorized'},401)};
 const db=localAccountDatabase();if(!db)return {error:send({message:'Local database not configured.'},503)};
 try{
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT a.admin_id, a.role, r.role_id, r.ticket_category
    FROM admins a LEFT JOIN roles r ON r.role_id=a.role AND r.status=1 AND r.is_delete=0
    WHERE a.admin_id=? AND a.status=1 LIMIT 1`,[Number(session.id)]);
  const record=rows[0];if(!record||record.role_id===null||record.role_id===undefined)return {error:send({message:'Ticket category access not authorized.'},403)};
  if(Number(record.role)===4)return {scope:{adminId:Number(session.id),all:true,category:null}};
  if(record.ticket_category===null||record.ticket_category===undefined||record.ticket_category==='')return {error:send({message:'Ticket category access not authorized.'},403)};
  const category=Number(record.ticket_category);
  if(!Number.isSafeInteger(category)||category<0)return {error:send({message:'Ticket category access not authorized.'},403)};
  return {scope:{adminId:Number(session.id),all:category===0,category:category===0?null:category}};
 }catch{return {error:send({message:'Ticket authorization unavailable.'},503)};}
}

const sortable:Record<string,string>={
 id:'t.tickets_id',fname:'t.fname',lname:'t.lname',full_name:"CONCAT(COALESCE(t.fname,''),' ',COALESCE(t.lname,''))",
 email:'t.email',title:'t.title',ticket_id:'t.ticket_id',message:'t.message',priority:'t.priority',
 created_at:'t.created_at',updated_at:'t.updated_at',category_name:'tc.name',user_name:'u.fname',
 last_reply_date:'(SELECT MAX(created_at) FROM ticket_replies r WHERE r.ticket_id=t.tickets_id)'};
const base=`FROM tickets t LEFT JOIN ticket_categories tc ON t.category=CAST(tc.ticket_category_id AS CHAR)
 LEFT JOIN users u ON u.user_id=t.user_id`;
const sqlDate=(col:string)=>`CASE WHEN ${col} IS NULL OR YEAR(${col})=0 OR MONTH(${col})=0 OR DAYOFMONTH(${col})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(${col},'%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END`;
export const ticketGridProjection=`t.tickets_id AS id,CONCAT(COALESCE(t.fname,''),' ',COALESCE(t.lname,'')) AS full_name,
 t.email,t.title,t.ticket_id,t.message,t.priority,t.category,tc.name AS category_name,t.user_id,
 u.fname AS user_name,t.attachment,t.status,${sqlDate('t.created_at')} AS created_at,
 ${sqlDate('t.updated_at')} AS updated_at,${sqlDate('(SELECT MAX(created_at) FROM ticket_replies r WHERE r.ticket_id=t.tickets_id)')} AS last_reply_date`;
const pnum=(s:string|null,def:number,max:number)=>s===null?def:/^[1-9]\d{0,7}$/.test(s)&&Number(s)<=max?Number(s):null;
// Original Express uses moment() in its server timezone. SourceIndia operates in
// India; this date-window implementation is deterministic in Asia/Kolkata. Verify
// exact DB-date parity on the Windows environment before declaring it equivalent.
const indiaDay=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const safeDay=(s:string|null)=>{
 if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const parsed=new Date(`${s}T00:00:00Z`);
 return Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==s?null:s;
};
const plusDay=(date:string,offset:number)=>{
 const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);
 return d.toISOString().slice(0,10);
};
const starts=(day:string)=>`${day} 00:00:00`;
const ends=(day:string)=>`${day} 23:59:59`;
export function ticketDateFilter(range:string,startDate:string|null,endDate:string|null,now=new Date()){
 const today=indiaDay(now),name=range.toLowerCase().replace(/\s+/g,'');
 let from:string,to:string;
 if(name==='today'){from=today;to=today;}
 else if(name==='yesterday'){from=to=plusDay(today,-1);}
 else if(name==='last7days'){from=plusDay(today,-6);to=today;}
 else if(name==='last30days'){from=plusDay(today,-29);to=today;}
 else if(name==='thismonth'){from=today.slice(0,7)+'-01';to=today;}
 else if(name==='lastmonth'){
  const first=new Date(`${today.slice(0,7)}-01T00:00:00Z`);first.setUTCMonth(first.getUTCMonth()-1);
  from=first.toISOString().slice(0,10);to=plusDay(today.slice(0,7)+'-01',-1);
 }else if(name==='customrange'){
  const first=safeDay(startDate),last=safeDay(endDate);
  if(!first||!last||first>last)return null;from=first;to=last;
 }else if(/^[1-9]\d{0,2}$/.test(name)){
  const days=Number(name);from=plusDay(today,-days+1);to=today;
 }else return null;
 if(to<from)return null;
 return [starts(from),ends(to)] as const;
}

export function ticketAdminGridPlan(url:string,scope:TicketScope){
 const q=new URL(url).searchParams;
 const allowed=new Set(['page','limit','search','sortBy','sort','dateRange','startDate','endDate','title','status','priority','category']);
 if([...q.keys()].some(k=>!allowed.has(k))||[...allowed].some(k=>q.getAll(k).length>1))return null;
 const page=pnum(q.get('page'),1,1e6),limit=pnum(q.get('limit'),10,100);
 if(page===null||limit===null||(page-1)*limit>1e8)return null;
 const sortBy=q.get('sortBy')||'id';if(!Object.hasOwn(sortable,sortBy))return null;
 const direction=q.get('sort')||'DESC';if(direction!=='ASC'&&direction!=='DESC')return null;
 const where:string[]=[],bind:(string|number)[]=[];
 if(!scope.all){if(scope.category===null)return null;where.push('t.category=?');bind.push(scope.category);}
 for(const key of ['status','priority','category'] as const){const value=q.get(key);if(!value)continue;
  if(key==='category'&&!scope.all)continue;
  if(value.length>64||(/[\x00-\x1f]/.test(value)))return null;
  where.push(`t.${key}=?`);bind.push(value);
 }
 const dateRange=q.get('dateRange')?.trim();
 if(dateRange){const period=ticketDateFilter(dateRange,q.get('startDate'),q.get('endDate'));
  if(!period)return null;
  where.push('t.created_at >= ? AND t.created_at <= ?');bind.push(...period);
 }else if(q.get('startDate')||q.get('endDate'))return null;
 const title=q.get('title');if(title){if(title.length>160)return null;where.push("t.title LIKE ? ESCAPE '!'");bind.push('%'+title.replace(/[!%_]/g,s=>'!'+s)+'%');}
 const search=q.get('search');if(search){if(search.length>160)return null;
  const like='%'+search.replace(/[!%_]/g,s=>'!'+s)+'%';
  const cols=["CONCAT(COALESCE(t.fname,''),' ',COALESCE(t.lname,''))",'t.email','t.title','t.ticket_id','t.priority','tc.name'];
  where.push('('+cols.map(x=>`${x} LIKE ? ESCAPE '!'`).join(' OR ')+')');bind.push(...cols.map(()=>like));
 }
 const whereSql=where.length?' WHERE '+where.join(' AND '):'';
 return {whereSql,bind,limit,page,orderSql:`${sortable[sortBy]} ${direction},t.tickets_id DESC`,base};
}
export async function ticketAdminGrid(req:NextRequest){
 const resolved=await ticketAdminScope(req);if('error'in resolved)return resolved.error;
 const plan=ticketAdminGridPlan(req.url,resolved.scope);if(!plan)return send({message:'Invalid ticket query.'},400);
 const db=localAccountDatabase();if(!db)return send({message:'Local database not configured.'},503);
 try{
  const [countRows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${base}${plan.whereSql}`,plan.bind);
  const total=Number(countRows[0]?.total??0);
  const [rows]=await db.query<RowDataPacket[]>(`SELECT ${ticketGridProjection} ${base}${plan.whereSql} ORDER BY ${plan.orderSql} LIMIT ? OFFSET ?`,[...plan.bind,plan.limit,(plan.page-1)*plan.limit]);
  return send({data:rows,totalRecords:total,filteredRecords:total});
 }catch{return send({message:'Ticket grid unavailable.'},503)}
}
