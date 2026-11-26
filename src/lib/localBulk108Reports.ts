/** Bulk108 audited read-only Admin reporting: newsletter history, activity and conflicts.
 * Explicit columns and bound parameters; never updates tracking counters or sends email.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {bulk108Paging,bulk108PositiveId,bulk108Order,bulk108Search,bulk108Like} from '@/lib/localBulk108Contracts';
import {resolveNewsletterHistoryIdentity,newsletterHistoryIdExpression} from '@/lib/localBulk108HistoryIdentity.mjs';
const send=(data:Record<string,unknown>,status=200)=>adminFaqResponse(data,status);
type Type='newsletter-histories'|'user-activity'|'category-conflict-logs';
type Action='list'|'count'|'serverSide'|'byUser';
const querySpecs={
 'newsletter-histories':{
  from:'news_latter_histories h LEFT JOIN users u ON h.user_id = u.user_id',
  cols:`h.user_id,CONCAT_WS(' ',u.fname,u.lname) AS user_name,u.is_seller AS user_is_seller,h.is_mail,h.code,h.email_view_count,h.created_at,h.updated_at`,
  sort:{is_mail:'h.is_mail',code:'h.code',email_view_count:'h.email_view_count',user_name:'u.fname',created_at:'h.created_at',updated_at:'h.updated_at'}
 },
 'user-activity':{
  from:'user_activity a LEFT JOIN users u ON a.user_id = u.user_id LEFT JOIN company_info c ON u.company_id = c.company_id',
  cols:`a.user_activity_id AS id,a.uuid,a.user_id,a.type,a.is_side,a.created_at,a.updated_at,u.fname AS user_fname,u.lname AS user_lname,u.email AS user_email,u.mobile AS user_mobile,u.status AS user_status,u.is_seller AS user_is_seller,c.organization_name AS company_name,c.organization_slug AS user_company_slug`,
  sort:{id:'a.user_activity_id',created_at:'a.created_at',updated_at:'a.updated_at',user_name:'u.fname',user_email:'u.email',user_mobile:'u.mobile',user_status:'u.status',user_is_seller:'u.is_seller',user_company_name:'c.organization_name'}
 },
 'category-conflict-logs':{
  from:'category_conflict_logs g',
  cols:'g.category_conflict_log_id AS id,g.uuid,g.source_module,g.conflict_module,g.conflict_flow,g.conflict_name,g.created_at,g.updated_at',
  sort:{id:'g.category_conflict_log_id',created_at:'g.created_at',updated_at:'g.updated_at'}
 }
} as const;
export async function bulk108ReportHandle(req:NextRequest,type:Type,action:Action,rawId?:string):Promise<Response>{
 if(!authorizedAdminFaq(req))return send({message:'Admin session required.'},401);
 const db=localAccountDatabase();if(!db)return send({message:'Local database unavailable.'},503);
 const q=new URL(req.url).searchParams;
 const spec=querySpecs[type];if(!spec)return send({message:'Unknown reporting module.'},404);
 const search=bulk108Search(req.url);if(search===null)return send({message:'Invalid search.'},400);
 const where:string[]=[],args:(string|number)[]=[];
 if(type==='newsletter-histories'){
  const newsId=q.get('newsLatter_id');
  if(action==='count'&&!newsId)return send({message:'newsLatter_id is required.'},400);
  if(newsId!==null){const id=bulk108PositiveId(newsId);if(id===null)return send({message:'Invalid newsletter ID.'},400);where.push('h.newsLatter_id = ?');args.push(id);}
  if(search){where.push("CONCAT_WS(' ',u.fname,u.lname) LIKE ?");args.push(bulk108Like(search));}
 }else if(type==='user-activity'){
  if(action==='byUser'){
   const id=bulk108PositiveId(rawId);if(id===null)return send({message:'Invalid user ID.'},400);
   try{
    const [users]=await db.execute<RowDataPacket[]>('SELECT fname,lname,status,is_seller,updated_at FROM users WHERE user_id = ? LIMIT 1',[id]);
    const [activities]=await db.execute<RowDataPacket[]>('SELECT user_activity_id AS id,uuid,user_id,type,is_side,created_at,updated_at FROM user_activity WHERE user_id = ? ORDER BY user_activity_id ASC LIMIT 500',[id]);
    const user=users[0];return send({user_fname:user?.fname??null,user_lname:user?.lname??null,user_status:user?.status??null,user_is_seller:user?.is_seller??null,user_updated_at:user?.updated_at??null,user_activity:activities});
   }catch{return send({message:'Activity lookup unavailable.'},503);}
  }
  if(search){where.push("(CONCAT_WS(' ',u.fname,u.lname) LIKE ? OR u.email LIKE ? OR u.mobile LIKE ? OR c.organization_name LIKE ?)");args.push(...Array(4).fill(bulk108Like(search)));}
 }else if(search){where.push('(g.source_module LIKE ? OR g.conflict_module LIKE ? OR g.conflict_flow LIKE ? OR g.conflict_name LIKE ?)');args.push(...Array(4).fill(bulk108Like(search)));}
 const clause=where.length?' WHERE '+where.join(' AND '):'';
 try{
  if(action==='count'){
   if(type==='newsletter-histories'){
    const [rows]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS \`all\`,SUM(h.is_mail=1) AS mailSent,SUM(h.is_mail=0) AS mailUnSent,SUM(h.email_view_count=1) AS mailOpen,SUM(h.email_view_count=0) AS mailNotOpen FROM ${spec.from}${clause}`,args);
    const v=rows[0];return send({all:Number(v?.all??0),mailSent:Number(v?.mailSent??0),mailUnSent:Number(v?.mailUnSent??0),mailOpen:Number(v?.mailOpen??0),mailNotOpen:Number(v?.mailNotOpen??0)});
   }
   if(type==='user-activity'){
    const [tot]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM user_activity');
    const [flags]=await db.execute<RowDataPacket[]>(`SELECT SUM(u.status=0) AS UserInactiveStatus,SUM(u.status=1) AS UserActiveStatus,SUM(u.is_approve=1) AS UserApprove,SUM(u.is_delete=1) AS UserDeleted
      FROM users u WHERE EXISTS(SELECT 1 FROM user_activity a WHERE a.user_id=u.user_id)`);
    return send({total:Number(tot[0]?.total??0),UserInactiveStatus:Number(flags[0]?.UserInactiveStatus??0),UserActiveStatus:Number(flags[0]?.UserActiveStatus??0),UserApprove:Number(flags[0]?.UserApprove??0),UserDeleted:Number(flags[0]?.UserDeleted??0)});
   }
   return send({message:'Count not available.'},405);
  }
  if(action!=='list'&&action!=='serverSide')return send({message:'Unsupported report.'},405);
  const pg=bulk108Paging(req.url);if(!pg)return send({message:'Invalid pagination.'},400);
  let cols:string=spec.cols;
  const sorts:Record<string,string>={...spec.sort};
  if(type==='newsletter-histories'){
   // The live table may not have the legacy model's newsletter_history_id.
   // Read-only metadata resolves an actual single-column PK or unique uuid;
   // no schema changes, guessed identifiers, or user-controlled SQL names.
   const [keyRows]=await db.execute<(RowDataPacket & {COLUMN_NAME:string;COLUMN_KEY:string;DATA_TYPE:string})[]>(
    'SELECT COLUMN_NAME,COLUMN_KEY,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    ['news_latter_histories']
   );
   const key=resolveNewsletterHistoryIdentity(keyRows);
   if(!key)return send({message:'Newsletter history table has no supported unique row key.'},503);
   const idSql=newsletterHistoryIdExpression(key);
   cols=`${idSql} AS id,${spec.cols}`;
   sorts.id=idSql;
  }
  const order=bulk108Order(req.url,sorts);
  if(order===null)return send({message:'Invalid sort.'},400);
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT ${cols} FROM ${spec.from}${clause}${order} LIMIT ? OFFSET ?`,[...args,pg.limit,pg.offset]);
  if(action==='list')return send({items:rows,page:pg.page,limit:pg.limit});
  const [base]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${spec.from}${type==='newsletter-histories'&&q.get('newsLatter_id')?' WHERE h.newsLatter_id = ?':''}`,type==='newsletter-histories'&&q.get('newsLatter_id')?[bulk108PositiveId(q.get('newsLatter_id'))]:[]);
  const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${spec.from}${clause}`,args);
  return send({data:rows,totalRecords:Number(base[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0),page:pg.page,limit:pg.limit});
 }catch{return send({message:'Local reporting read unavailable.'},503);}
}
