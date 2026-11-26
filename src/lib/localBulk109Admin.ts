/** Bulk109: Admin-only, read-only management for 7 high-traffic legacy modules.
 * No password, real_password, OTP, token, remember_token or authentication secret
 * may be returned. Each query has an explicit immutable column allowlist.
 * Original Sequelize model/route files were inspected read-only. This is NOT
 * a claim of exact Express response/permissions parity.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {adminSessionCookie,readAdminSession} from '@/lib/adminSession';
import {adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {bulk109Id,bulk109Page,bulk109Search,bulk109Like,bulk109Sort,bulk109Query,bulk109IndiaBounds,bulk109UsersPageFirst,bulk109OrderByIds} from '@/lib/localBulk109Contracts.mjs';

type Kind='sellers'|'buyers'|'users'|'companies'|'enquiries'|'tickets'|'buyer-enquiries';
type Action='list'|'count'|'serverSide'|'filtered'|'detail'|'summary';
type Parameters=Array<string|number>;
type Spec={from:string,key:string,select:string,search:string[],sort:Record<string,string>,base:string,role:'user'|'none'|'ticket'};
const userSelect=`u.user_id AS id,u.fname,u.lname,u.email,u.mobile,u.alternate_number,
 u.country_code,u.is_seller,u.company_id,u.status,u.is_approve,u.is_complete,u.is_delete,
 u.member_role,u.elcina_member,u.payment_status,u.country,u.state,u.city,u.zipcode,
 u.website,u.user_company,u.walkin_buyer,u.created_at,u.updated_at,
 c.organization_name AS company_name,c.organization_slug AS company_slug,
 co.name AS country_name,st.name AS state_name,ct.name AS city_name`;
const userFrom=`users u LEFT JOIN company_info c ON u.company_id=c.company_id
 LEFT JOIN countries co ON u.country=CAST(co.country_id AS CHAR)
 LEFT JOIN states st ON u.state=CAST(st.state_id AS CHAR)
 LEFT JOIN cities ct ON u.city=CAST(ct.city_id AS CHAR)`;
const userSort:Record<string,string>={id:'u.user_id',fname:'u.fname',lname:'u.lname',email:'u.email',mobile:'u.mobile',status:'u.status',is_approve:'u.is_approve',is_complete:'u.is_complete',created_at:'u.created_at',updated_at:'u.updated_at',full_name:"CONCAT_WS(' ',u.fname,u.lname)",company_name:'c.organization_name',country_name:'co.name',state_name:'st.name',city_name:'ct.name'};
const spec:Record<Kind,Spec>={
 sellers:{from:userFrom,key:'u.user_id',select:userSelect,sort:userSort,search:['u.fname','u.lname','u.email','u.mobile','c.organization_name','co.name','st.name','ct.name'],base:'u.is_seller=1',role:'user'},
 buyers:{from:userFrom,key:'u.user_id',select:userSelect,sort:userSort,search:['u.fname','u.lname','u.email','u.mobile','c.organization_name','co.name','st.name','ct.name'],base:'u.is_seller=0',role:'user'},
 users:{from:userFrom,key:'u.user_id',select:userSelect,sort:userSort,search:['u.fname','u.lname','u.email','u.mobile','c.organization_name'],base:'1=1',role:'user'},
 companies:{from:'company_info c',key:'c.company_id',select:`c.company_id AS id,c.uuid,c.organization_name,c.organization_slug,c.user_type,c.role,
 c.contact_person,c.company_phone,c.company_website,c.company_email,c.core_activity,c.activity,
 c.nature_business,c.designation,c.is_verified,c.is_star_seller,c.featured_company,c.is_delete,c.created_at,c.updated_at`,
 sort:{id:'c.company_id',organization_name:'c.organization_name',created_at:'c.created_at',updated_at:'c.updated_at',is_verified:'c.is_verified'},
 search:['c.organization_name','c.organization_slug','c.company_email','c.contact_person'],base:'1=1',role:'none'},
 enquiries:{from:`enquiries e LEFT JOIN users fu ON e.user_id=fu.user_id
 LEFT JOIN company_info fc ON fu.company_id=fc.company_id`,key:'e.enquiry_id',select:`e.enquiry_id AS id,e.uuid,e.enquiry_number,e.type,e.company_id,e.user_id,e.buyer_company_id,
 e.quantity,e.description,e.category,e.sub_category,e.category_name,e.sub_category_name,
 e.status,e.is_delete,e.name,e.email,e.phone,e.company,e.is_approve,e.created_at,e.updated_at,
 CONCAT_WS(' ',fu.fname,fu.lname) AS from_full_name,fu.email AS from_email,fu.mobile AS from_mobile,
 fc.organization_name AS from_organization_name`,
 sort:{id:'e.enquiry_id',enquiry_number:'e.enquiry_number',status:'e.status',is_approve:'e.is_approve',created_at:'e.created_at',updated_at:'e.updated_at',from_full_name:"CONCAT_WS(' ',fu.fname,fu.lname)"},
 search:['e.enquiry_number','e.name','e.email','e.phone','e.category_name','e.sub_category_name','fu.email','fc.organization_name'],base:'1=1',role:'none'},
 tickets:{from:`tickets t LEFT JOIN ticket_categories tc ON t.category=CAST(tc.ticket_category_id AS CHAR)
 LEFT JOIN users u ON t.user_id=u.user_id`,key:'t.tickets_id',select:`t.tickets_id AS id,t.uuid,t.fname,t.lname,t.phone,t.email,t.cc_email,
 t.ticket_id,t.user_id,t.title,t.message,t.status,t.is_complete,t.priority,t.category,
 t.attachment,t.created_by,t.added_by,t.created_at,t.updated_at,
 tc.name AS category_name,CONCAT_WS(' ',u.fname,u.lname) AS user_name`,
 sort:{id:'t.tickets_id',ticket_id:'t.ticket_id',status:'t.status',priority:'t.priority',created_at:'t.created_at',updated_at:'t.updated_at',category_name:'tc.name'},
 search:['t.ticket_id','t.title','t.email','t.fname','t.lname','tc.name'],base:'1=1',role:'ticket'},
 'buyer-enquiries':{from:`buyerenquiry b LEFT JOIN users sender ON b.user_id=sender.user_id
 LEFT JOIN users receiver ON b.reciever_id=receiver.user_id
 LEFT JOIN company_info c ON sender.company_id=c.company_id`,key:'b.buyerenquiry_id',select:`b.buyerenquiry_id AS id,b.uuid,b.title,b.message,b.user_id,b.reciever_id,b.created_at,b.updated_at,
 CONCAT_WS(' ',sender.fname,sender.lname) AS sender_name,sender.company_id AS company_id,
 c.organization_name AS company_name,c.organization_slug AS company_slug,
 CONCAT_WS(' ',receiver.fname,receiver.lname) AS receiver_name`,
 sort:{id:'b.buyerenquiry_id',title:'b.title',created_at:'b.created_at',updated_at:'b.updated_at'},
 search:['b.title','b.message','sender.fname','sender.lname','c.organization_name'],base:'1=1',role:'none'}
};
export const BULK109_MODULES=Object.freeze(Object.keys(spec));
export function bulk109Select(kind:Kind){return `SELECT ${spec[kind].select} FROM ${spec[kind].from}`;}
export function bulk109SafeSql(kind:Kind,action:Action){return action==='count'||action==='summary'?`SELECT COUNT(*) AS total FROM ${spec[kind].from}`:bulk109Select(kind);}
// COUNT needs only the primary table when the WHERE clause has no joined search
// columns. The list projection still uses joins, but counting the same rows twice
// through large LEFT JOINs made /server-side unnecessarily slow on live data.
const countRoot:Record<Kind,string>={
 sellers:'users u',buyers:'users u',users:'users u',companies:'company_info c',
 enquiries:'enquiries e',tickets:'tickets t','buyer-enquiries':'buyerenquiry b'
};
export function bulk109CountPlan(kind:Kind,withJoinedSearch:boolean){
 return withJoinedSearch?spec[kind].from:countRoot[kind];
}
const send=(data:Record<string,unknown>,status=200)=>adminFaqResponse(data,status);
function selectors(kind:Kind,req:NextRequest,ticketCategory:number|null){
 const q=new URL(req.url).searchParams;
 if(!bulk109Query(q,kind))return null;
 const s=spec[kind];const search=bulk109Search(q);if(search===null)return null;
 const base=[s.base], extra:string[]=[], baseArgs:Parameters=[], extraArgs:Parameters=[];
 if(s.role==='ticket'){
  if(ticketCategory===null)return null;
  if(ticketCategory>0){base.push('t.category = ?');baseArgs.push(ticketCategory);}
 }
 if(s.role==='user'){
  const deleted=q.get('getDeleted')==='true';
  base.push(`u.is_delete = ?`);baseArgs.push(deleted?1:0);
  if(q.get('todayOnly')==='true'){
   // UTC bounds for the Indian business day, independent of server timezone.
   const [todayStart,tomorrowStart]=bulk109IndiaBounds();
   base.push('u.created_at >= ? AND u.created_at < ?');baseArgs.push(todayStart,tomorrowStart);
  }else if(kind!=='users'&&!deleted){
   const inactive=q.get('getInactive')==='true';
   const notApproved=q.get('getNotApproved')==='true';
   const notCompleted=q.get('getNotCompleted')==='true';
   base.push(inactive?'u.status=0':'u.status=1');
   if(notCompleted){base.push('u.is_complete=0','u.is_approve=0');}
   else if(notApproved){base.push('u.is_complete=1','u.is_approve=0');}
   else if(!inactive){base.push('u.is_complete=1','u.is_approve=1');}
   if(kind==='sellers'||(!inactive&&!notApproved&&!notCompleted))base.push('u.member_role=1');

  }
  for(const param of ['country','state','city']){
   if(q.get(param)!==null){const id=bulk109Id(q.get(param)!);if(id===null)return null;extra.push(`u.${param} = ?`);extraArgs.push(id);}
  }
 }else if(kind==='companies'){
  base.push('c.is_delete = ?');baseArgs.push(q.get('getDeleted')==='true'?1:0);
 }else if(kind==='enquiries'){
  base.push('e.is_delete = ?');baseArgs.push(q.get('getDeleted')==='true'?1:0);
  for(const param of ['user_id','company_id']){
   if(q.get(param)!==null){const id=bulk109Id(q.get(param)!);if(id===null)return null;extra.push(`e.${param} = ?`);extraArgs.push(id);}
  }
 }else if(kind==='tickets'){
  if(q.get('status')!==null){extra.push('t.status = ?');extraArgs.push(Number(q.get('status')));}
  if(q.get('category')!==null){const id=bulk109Id(q.get('category')!);if(id===null)return null;extra.push('t.category = ?');extraArgs.push(id);}
  const priority=q.get('priority')?.trim();if(priority){extra.push('t.priority = ?');extraArgs.push(priority);}
 }else if(kind==='buyer-enquiries'){
  if(q.get('user_id')!==null){const id=bulk109Id(q.get('user_id')!);if(id===null)return null;extra.push('b.user_id = ?');extraArgs.push(id);}
  if(q.get('company_id')!==null){const id=bulk109Id(q.get('company_id')!);if(id===null)return null;extra.push('sender.company_id = ?');extraArgs.push(id);}
 }
 if(search){extra.push('('+s.search.map(c=>`${c} LIKE ? ESCAPE '!'`).join(' OR ')+')');extraArgs.push(...s.search.map(()=>bulk109Like(search)));}
 for(const field of ['status','is_approve','is_complete','is_delete']){
  if(q.get(field)===null)continue;
  const prefix=s.role==='user'?'u':kind==='enquiries'?'e':kind==='tickets'?'t':null;
  if(!prefix||(kind==='tickets'&&field!=='status')||(kind==='enquiries'&&field==='is_complete'))return null;
  extra.push(`${prefix}.${field} = ?`);extraArgs.push(Number(q.get(field)));
 }
 const baseWhere=' WHERE '+base.join(' AND ');
 const where=' WHERE '+[...base,...extra].join(' AND ');
 return {where,baseWhere,args:[...baseArgs,...extraArgs],baseArgs};
}
async function adminTicketCategory(req:NextRequest,db:NonNullable<ReturnType<typeof localAccountDatabase>>):Promise<number|null>{
 const session=readAdminSession(req.cookies.get(adminSessionCookie)?.value);
 const adminId=bulk109Id(session?.id??'');if(!adminId)return null;
 const [rows]=await db.execute<RowDataPacket[]>(`SELECT a.role,r.ticket_category FROM admins a LEFT JOIN roles r ON a.role=r.role_id
 WHERE a.admin_id=? AND a.status=1 LIMIT 1`,[adminId]);
 if(!rows[0])return null;
 if(Number(rows[0].role)===4)return 0; // original controller's super-admin role bypass
 const category=rows[0].ticket_category;
 // A NULL ticket-category role must not be converted by Number(null) into 0 (all categories).
 if(category===null||category===undefined||category==='')return null;
 return Number.isSafeInteger(Number(category))&&Number(category)>=0?Number(category):null;
}
export async function bulk109Handle(req:NextRequest,kind:Kind,action:Action,rawId?:string):Promise<Response>{
 const session=readAdminSession(req.cookies.get(adminSessionCookie)?.value);
 if(!session)return send({message:'Admin session required.'},401);
 if(!spec[kind])return send({message:'Unknown module.'},404);
 const q=new URL(req.url).searchParams;
 const id=action==='detail'?bulk109Id(rawId??''):null;
 if(action==='detail'&&id===null)return send({message:'Invalid ID.'},400);
 const page=action==='list'||action==='serverSide'||action==='filtered'?bulk109Page(q):null;
 if(['list','serverSide','filtered'].includes(action)&&page===null)return send({message:'Invalid pagination.'},400);
 const sort=action==='list'||action==='serverSide'||action==='filtered'?bulk109Sort(q,spec[kind].sort,spec[kind].key):'';
 if(sort===null)return send({message:'Invalid sorting.'},400);
 const db=localAccountDatabase();if(!db)return send({message:'Local database not configured.'},503);
 let stage='ticket-scope';
 try{
  let ticketCategory:number|null=0;
  if(kind==='tickets'){
   ticketCategory=await adminTicketCategory(req,db);
   if(ticketCategory===null)return send({message:'Ticket category access not authorized.'},403);
  }
  const condition=selectors(kind,req,ticketCategory);if(!condition)return send({message:'Invalid query filter.'},400);
  const s=spec[kind];const base=bulk109Select(kind);
  if(action==='detail'){
   stage='detail';
   const [rows]=await db.execute<RowDataPacket[]>(`${base} WHERE ${s.base}${s.role==='ticket'&&ticketCategory!==null&&ticketCategory>0?' AND t.category = ?':''} AND ${s.key} = ? LIMIT 1`,[...(s.role==='ticket'&&ticketCategory!==null&&ticketCategory>0?[ticketCategory]:[]),id]);
   if(!rows[0])return send({message:'Record not found.'},404);
   if(kind==='tickets'){
    stage='ticket-replies';
    const [replies]=await db.execute<RowDataPacket[]>(`SELECT ticket_reply_id AS id,uuid,ticket_id,user_id,reply,added_by,attachment,media_type,created_at,updated_at
      FROM ticket_replies WHERE ticket_id = ? ORDER BY ticket_reply_id DESC LIMIT 200`,[id]);
    return send({item:rows[0],replies,lastReply:replies[0]??null});
   }
   return send({item:rows[0]});
  }
  if(action==='count'||action==='summary'){
   stage=action;
   if(action==='count'&&kind!=='sellers'&&kind!=='buyers'){
    const countFrom=bulk109CountPlan(kind,bulk109Search(q)!=='');
    const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${countFrom}${condition.where}`,condition.args);
    return send({total:Number(rows[0]?.total??0)});
   }
   const column=kind==='sellers'||kind==='buyers'||kind==='users'?'u':kind==='enquiries'?'e':kind==='tickets'?'t':kind==='companies'?'c':null;
   if(kind==='buyer-enquiries'){
    const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total,COUNT(DISTINCT b.user_id) AS senders,COUNT(DISTINCT b.reciever_id) AS receivers FROM ${s.from}${condition.where}`,condition.args);
    return send({total:Number(rows[0]?.total??0),senders:Number(rows[0]?.senders??0),receivers:Number(rows[0]?.receivers??0)});
   }
   if(!column)return send({message:'Summary unavailable.'},405);
   let counts:RowDataPacket[];
   if(kind==='sellers'||kind==='buyers'){
    const role=kind==='sellers'?1:0;
    const [todayStart,tomorrowStart]=bulk109IndiaBounds();
    if(kind==='sellers'){
     [counts]=await db.execute<RowDataPacket[]>(`SELECT
      SUM(EXISTS(SELECT 1 FROM company_info c WHERE c.company_id=u.company_id)) AS total,
      SUM(u.is_delete=0 AND u.created_at >= ? AND u.created_at < ?) AS addedToday,
      SUM(u.status=1 AND u.is_delete=0 AND u.member_role=1 AND u.is_complete=1 AND u.is_approve=1
        AND EXISTS(SELECT 1 FROM company_info c WHERE c.company_id=u.company_id)) AS statusActive,
      SUM(u.status=0 AND u.is_delete=0 AND u.member_role=1 AND u.is_complete=1
        AND EXISTS(SELECT 1 FROM company_info c WHERE c.company_id=u.company_id)) AS statusInactive,
      SUM(u.is_approve=0 AND u.is_delete=0 AND u.is_complete=1
        AND EXISTS(SELECT 1 FROM company_info c WHERE c.company_id=u.company_id)) AS notApproved,
      SUM(u.is_complete=0 AND u.is_delete=0 AND u.is_approve=0
        AND EXISTS(SELECT 1 FROM company_info c WHERE c.company_id=u.company_id)) AS notCompleted,
      SUM(u.is_delete=1) AS deleted FROM users u WHERE u.is_seller = ?`,[todayStart,tomorrowStart,role]);
    }else{
     [counts]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total,
      SUM(u.is_delete=0 AND u.created_at >= ? AND u.created_at < ?) AS addedToday,
      SUM(u.is_delete=0 AND u.status=1 AND u.is_approve=1) AS statusActive,
      SUM(u.is_delete=0 AND u.status=0) AS statusInactive,
      SUM(u.is_delete=0 AND u.status=1 AND u.is_complete=1 AND u.is_approve=0) AS notApproved,
      SUM(u.is_delete=1) AS deleted FROM users u WHERE u.is_seller = ?`,[todayStart,tomorrowStart,role]);
    }

   }else{
    // Summary aggregates only reference columns of the root entity table.
    // In particular, `users` joins company and three location tables for list
    // display, but none of those joins is needed for the summary numbers. On
    // large live databases joining every user before aggregation can time out.
    // Use the same root-only FROM plan as the already-working users:count.
    [counts]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total,
      SUM(${column}.${kind==='companies'?'is_verified':'status'}=1) AS statusActive,SUM(${column}.${kind==='companies'?'is_verified':'status'}=0) AS statusInactive
      FROM ${bulk109CountPlan(kind,false)}${condition.baseWhere}`,condition.baseArgs);
   }
   const v=counts[0];return send({total:Number(v?.total??0),statusActive:Number(v?.statusActive??0),statusInactive:Number(v?.statusInactive??0),
     ...(kind==='sellers'||kind==='buyers'?{addedToday:Number(v?.addedToday??0),deleted:Number(v?.deleted??0),notApproved:Number(v?.notApproved??0),...(kind==='sellers'?{notCompleted:Number(v?.notCompleted??0)}:{})}:{})});
  }
  // Users normally need four LEFT JOINs for company and location names. On
  // unsearched, user-column-sorted requests, let MySQL choose a bounded set of
  // user primary keys FIRST, then enrich only that page. This avoids performing
  // four joins across all matching users before LIMIT is applied. Joined search
  // and joined sorts keep the original single-query path for correct semantics.
  let rows:RowDataPacket[];
  if(bulk109UsersPageFirst(kind,q)){
   stage='users-page-ids';
   const [idRows]=await db.execute<RowDataPacket[]>(
    `SELECT u.user_id AS id FROM users u${condition.where}${sort} LIMIT ? OFFSET ?`,
    [...condition.args,page!.limit,page!.offset]);
   const ids=idRows.map(row=>Number(row.id));
   if(ids.some(id=>!Number.isSafeInteger(id)||id<=0)||new Set(ids).size!==ids.length){
    throw new Error('Invalid users page primary keys.');
   }
   if(ids.length===0){rows=[];}
   else{
    stage='users-page-enrich';
    const placeholders=ids.map(()=>'?').join(','); // <=100 validated IDs, no raw user SQL
    // The SELECT projection contains `u.user_id AS id`, which the order helper
    // requires. mysql2 RowDataPacket alone does not declare that column in TS.
    const [enriched]=await db.execute<(RowDataPacket & {id:number|string})[]>(
     `${base} WHERE u.user_id IN (${placeholders})`,ids);
    rows=bulk109OrderByIds(ids,enriched);
   }
  }else{
   stage='listing';
   [rows]=await db.execute<RowDataPacket[]>(
    `${base}${condition.where}${sort} LIMIT ? OFFSET ?`,
    [...condition.args,page!.limit,page!.offset]);
  }
  if(action==='list')return send({items:rows,page:page!.page,limit:page!.limit});
  stage='total-count';
  // baseWhere only refers to the module's own table; avoid costly joins.
  const [total]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${bulk109CountPlan(kind,false)}${condition.baseWhere}`,condition.baseArgs);
  // When there are no extra filters, total and filtered counts are identical.
  // Reusing the first count also prevents duplicate long-running SQL requests.
  let filtered=total;
  if(condition.where!==condition.baseWhere){
   stage='filtered-count';
   // Joined text-search columns require JOINs; other validated filters do not.
   const joinedSearch=bulk109Search(q)!=='';
   [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${bulk109CountPlan(kind,joinedSearch)}${condition.where}`,condition.args);
  }
  return send({data:rows,totalRecords:Number(total[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0),page:page!.page,limit:page!.limit});
 }catch(error){
  // Development-only, non-sensitive diagnostics: never expose SQL text, values, cookies, or DB errors.
  const raw=(error as {code?:unknown})?.code;
  const code=typeof raw==='string'&&/^[A-Z][A-Z0-9_]{2,47}$/.test(raw)?raw:'READ_FAILURE';
  return send({message:'Local Admin read unavailable; check Bulk109 schema preflight.',
   ...(process.env.NODE_ENV==='production'?{}:{diagnostic:{kind,action,stage,code}})},503);
 }
}
