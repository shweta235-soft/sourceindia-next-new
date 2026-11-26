/** Bulk110 original Express Seller/Buyer analytical GETs, Admin-only.
 * Fixed SQL allowlists; strictly bounded time-series scans; no writes or email.
 * Source: sellerController.js / buyerController.js / routes, inspected read-only.
 * Does not assert complete Express parity.
 */
import type { NextRequest } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { adminSessionCookie, readAdminSession } from '@/lib/adminSession';
import { adminFaqResponse } from '@/lib/localAdminFaqAuth';
import { localAccountDatabase } from '@/lib/localAccountDatabase';
import {
 bulk110Id,bulk110Only,bulk110Flag,bulk110Series,bulk110Totals,bulk110Trend,bulk110GroupSourcing
} from '@/lib/localBulk110Contracts.mjs';

type Kind='sellers'|'buyers';
type Operation='chart'|'trends'|'seller-categories'|'seller-subcategories'|'seller-subcategories-by-user'|'with-messages'|'seller-message'|'designations'|'nature_business'|'get-buyer-sourcing-interests';
const result=(data:unknown,status=200)=>adminFaqResponse(data as Record<string,unknown>,status);
const sellerOnly=new Set<Operation>(['trends','seller-categories','seller-subcategories','seller-subcategories-by-user','with-messages','seller-message','designations','nature_business']);
const buyerOnly=new Set<Operation>(['get-buyer-sourcing-interests']);
const seriesColumns={
 sellers:`SUM(CASE WHEN status=1 AND is_delete=0 AND member_role=1 AND is_complete=1 AND is_approve=1 THEN 1 ELSE 0 END) AS active,
 SUM(CASE WHEN status=0 AND is_delete=0 AND member_role=1 AND is_complete=1 THEN 1 ELSE 0 END) AS inactive,
 SUM(CASE WHEN is_approve=0 AND is_delete=0 AND is_complete=1 THEN 1 ELSE 0 END) AS notApproved,
 SUM(CASE WHEN is_complete=0 AND is_delete=0 AND is_approve=0 THEN 1 ELSE 0 END) AS notCompleted,
 SUM(CASE WHEN is_delete=1 THEN 1 ELSE 0 END) AS deleted`,
 buyers:`SUM(CASE WHEN status=1 AND is_delete=0 AND is_approve=1 THEN 1 ELSE 0 END) AS active,
 SUM(CASE WHEN status=0 AND is_delete=0 THEN 1 ELSE 0 END) AS inactive,
 SUM(CASE WHEN is_approve=0 AND is_delete=0 AND status=1 THEN 1 ELSE 0 END) AS notApproved,
 SUM(CASE WHEN is_delete=1 THEN 1 ELSE 0 END) AS deleted`
};
export async function bulk110Handle(request:NextRequest,kind:Kind,action:Operation,rawId?:string):Promise<Response>{
 const session=readAdminSession(request.cookies.get(adminSessionCookie)?.value);
 if(!session)return result({message:'Admin session required.'},401);
 if(sellerOnly.has(action)&&kind!=='sellers'||buyerOnly.has(action)&&kind!=='buyers')return result({message:'Unknown endpoint.'},404);
 const params=new URL(request.url).searchParams;
 const id=action==='seller-message'?bulk110Id(rawId):null;
 if(action==='seller-message'&&id===null)return result({message:'Invalid seller ID.'},400);
 let mode:'chart'|'trends'|null=null;
 if(action==='chart'||action==='trends')mode=action;
 const series=mode?bulk110Series(params,mode):null;
 if(mode&&series===null)return result({message:'Invalid or unbounded chart date range.'},400);
 const categoryRequired=action==='seller-subcategories'||action==='seller-subcategories-by-user';
 const userRequired=action==='seller-subcategories-by-user'||action==='get-buyer-sourcing-interests';
 const allowed=action==='seller-subcategories'?['category_id']:
  action==='seller-subcategories-by-user'?['category_id','user_id']:
  action==='get-buyer-sourcing-interests'?['user_id']:
  action==='designations'?['status']:
  mode==='chart'?['startDate','endDate','type']:
  mode==='trends'?['period','from','to']:[];
 if(!bulk110Only(params,allowed))return result({message:'Invalid query parameters.'},400);
 const categoryId=categoryRequired?bulk110Id(params.get('category_id')):null;
 const userId=userRequired?bulk110Id(params.get('user_id')):null;
 if(categoryRequired&&categoryId===null)return result({message:'category_id is required and must be positive.'},400);
 if(userRequired&&userId===null)return result({message:'user_id is required and must be positive.'},400);
 const status=action==='designations'?bulk110Flag(params.get('status')):null;
 if(status===undefined)return result({message:'Invalid status.'},400);
 const db=localAccountDatabase();
 if(!db)return result({message:'Local database not configured.'},503);
 let stage='query';
 try{
  if(series&&mode){
   // One aggregate scan of the root users table, no company/location joins.
   stage='chart-aggregate';
   const [rows]=await db.execute<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '${series.format}') AS date, ${seriesColumns[kind]}
     FROM users WHERE is_seller=? AND created_at>=? AND created_at<?
     GROUP BY DATE_FORMAT(created_at, '${series.format}') ORDER BY date ASC`,
    [kind==='sellers'?1:0,series.fromSql,series.endSql]);
   const safeRows=rows.map(row=>({date:String(row.date),active:row.active,inactive:row.inactive,notApproved:row.notApproved,notCompleted:row.notCompleted,deleted:row.deleted}));
   if(mode==='trends')return result(bulk110Trend(kind,safeRows,series));
   const data=bulk110Totals(kind,safeRows,series);
   if(kind==='sellers'&&series.type==='ALLACTIVE')return result(data.map(item=>({date:item.date,value:item.Total,volume:item.Total})));
   return result(data);
  }
  if(action==='seller-categories'){
   stage='seller-categories';
   const [rows]=await db.execute<RowDataPacket[]>(
    'SELECT category_id AS id,name,slug FROM categories WHERE is_delete=0 AND status=1 ORDER BY category_id ASC LIMIT 5000');
   return result({success:true,data:rows});
  }
  if(action==='seller-subcategories'||action==='seller-subcategories-by-user'){
   stage='seller-subcategories';
   const [rows]=await db.execute<RowDataPacket[]>(
    `SELECT sub_category_id AS id,name,slug,category AS category_id
     FROM sub_categories WHERE category=? ${action==='seller-subcategories-by-user'?'AND is_delete=0 AND status=1':''}
     ORDER BY sub_category_id ASC LIMIT 5000`,[categoryId]);
   // Legacy `seller-subcategories` had an unusual flattened Sequelize key;
   // normalised rows here avoid the empty-array bug without returning secrets.
   return result(action==='seller-subcategories'?rows:rows.map(row=>({id:row.id,name:row.name,slug:row.slug,category_id:row.category_id})));
  }
  if(action==='with-messages'){
   stage='seller-messages-index';
   const [rows]=await db.execute<RowDataPacket[]>(
    'SELECT DISTINCT user_id FROM seller_messages WHERE user_id IS NOT NULL ORDER BY user_id ASC LIMIT 10000');
   return result({user_ids:rows.map(row=>Number(row.user_id))});
  }
  if(action==='seller-message'){
   stage='seller-message';
   const [rows]=await db.execute<RowDataPacket[]>(
    `SELECT sm.seller_message_id AS id,sm.uuid,sm.user_id,sm.message,sm.created_at,sm.updated_at,
     u.user_id AS linked_user_id,u.fname,u.lname,u.email,u.is_seller
     FROM seller_messages sm LEFT JOIN users u ON u.user_id=sm.user_id
     WHERE sm.user_id=? ORDER BY sm.seller_message_id DESC LIMIT 1`,[id]);
   if(!rows[0])return result({message:'Seller message not found.',data:null},404);
   const row=rows[0];
   return result({message:'Seller message fetched successfully',data:{
    id:row.id,uuid:row.uuid,user_id:row.user_id,message:row.message,created_at:row.created_at,updated_at:row.updated_at,
    Users:row.linked_user_id===null?null:{id:row.linked_user_id,fname:row.fname,lname:row.lname,email:row.email,is_seller:row.is_seller}
   }});
  }
  if(action==='designations'||action==='nature_business'){
   stage='seller-master-data';
   const table=action==='designations'?'designations':'nature_businesses';
   const key=action==='designations'?'designation_id':'nature_business_id';
   const where=action==='designations'&&status!==null?' WHERE status=?':'';
   const [rows]=await db.execute<RowDataPacket[]>(
    `SELECT ${key} AS id,uuid,name,status,created_at,updated_at FROM ${table}${where} ORDER BY ${key} ASC LIMIT 5000`,
    where?[status]:[]);
   return result(rows);
  }
  if(action==='get-buyer-sourcing-interests'){
   stage='buyer-sourcing-interests';
   const [rows]=await db.execute<RowDataPacket[]>(
    `SELECT b.item_category_id,b.item_subcategory_id,ic.name AS category_name,isc.name AS subcategory_name
     FROM buyer_sourcing_interests b
     LEFT JOIN item_category ic ON ic.item_category_id=b.item_category_id
     LEFT JOIN item_subcategory isc ON isc.item_subcategory_id=b.item_subcategory_id
     WHERE b.user_id=? ORDER BY b.item_category_id ASC,b.item_subcategory_id ASC LIMIT 5000`,[userId]);
   const data=bulk110GroupSourcing(rows.map(row=>({item_category_id:row.item_category_id,item_subcategory_id:row.item_subcategory_id,category_name:row.category_name,subcategory_name:row.subcategory_name})));
   return result(rows.length?{data}: {data:[],message:'No sourcing interests found for this user.'});
  }
  return result({message:'Unknown endpoint.'},404);
 }catch(error){
  const e=error as {code?:unknown};
  const code=typeof e.code==='string'&&/^[A-Z][A-Z0-9_]{2,47}$/.test(e.code)?e.code:'DATABASE_ERROR';
  // never include SQL text, connection strings, user-submitted values, or PII
  return result({message:'Admin read temporarily unavailable.',...(process.env.NODE_ENV==='development'?{diagnostic:{code,stage}}:{})},503);
 }
}
