/** Bulk111 buyer-scoped dashboard APIs. Source: original userDashbordController.js.
 * Only local, signed bearer tokens are accepted. All reads are owned by the token
 * subject. Existing frontend is NOT silently switched to these endpoints.
 */
import {randomUUID} from 'node:crypto';
import type {RowDataPacket} from 'mysql2';
import type {PoolConnection} from 'mysql2/promise';
import {bearerAuthorization} from '@/lib/accountSession';
import {localAccountDatabase,localProfileById} from '@/lib/localAccountDatabase';
import {localAuthSecret,verifyLocalAuthToken} from '@/lib/localAuthToken';
import {profileMatchesSession} from '@/lib/localUserProfile';
import {bulk111Id,bulk111Query,bulk111InterestBody,bulk111SourcingBody,bulk111InterestTree,bulk111ItemTree,bulk111MarkChecked} from '@/lib/localBulk111Contracts.mjs';

type GetAction='buyer-interest'|'get-buyer-interest'|'get-itemtype'|'get-item-subcategory'|'get-products'|'get-seller-company';
type PostAction='store-buyer-interest'|'store-item-subcategory';
const headers={'Cache-Control':'private, no-store','Pragma':'no-cache','Vary':'Authorization'};
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers});
const fail=(message:string,status:number)=>respond({message},status);
const schemaCode=(error:unknown)=>{const c=(error as {code?:unknown})?.code;return typeof c==='string'&&/^[A-Z][A-Z0-9_]{2,47}$/.test(c)?c:'DATABASE_ERROR';};
const stageError=(e:unknown,stage:string)=>respond({message:'Buyer dashboard temporarily unavailable.',...(process.env.NODE_ENV==='development'?{diagnostic:{code:schemaCode(e),stage}}:{})},503);
const sameOrigin=(req:Request)=>{
 const origin=req.headers.get('origin');if(!origin||req.headers.get('sec-fetch-site')==='cross-site')return false;
 try{return new URL(origin).origin===new URL(req.url).origin && new URL(req.url).host===req.headers.get('host');}catch{return false;}
};
async function loggedBuyer(req:Request):Promise<{id:number}|Response>{
 const secret=localAuthSecret(process.env.LOCAL_AUTH_JWT_SECRET);
 if(!secret)return fail('Local authentication is not configured.',503);
 const bearer=bearerAuthorization(req.headers.get('authorization'));
 if(!bearer)return fail('Please sign in again.',401);
 const claims=verifyLocalAuthToken(bearer.replace(/^Bearer /i,''),secret);
 if(!claims)return fail('Please sign in again.',401);
 if(claims.is_seller!==0)return fail('Buyer account required.',403);
 if(!localAccountDatabase())return fail('Local database is not configured.',503);
 try {
  const row=await localProfileById(claims.id);
  if(!profileMatchesSession(row,claims))return fail('Please sign in again.',401);
  return {id:claims.id};
 }catch(e){return stageError(e,'account-verify');}
}
export async function bulk111Read(req:Request, action:GetAction):Promise<Response>{
 const identity=await loggedBuyer(req);if(identity instanceof Response)return identity;
 const params=new URL(req.url).searchParams;
 const parsed=bulk111Query(params,identity.id,action==='get-item-subcategory'?['categoryId']:[]);
 if(!parsed)return fail('Invalid query parameters.',400);
 if('forbidden' in parsed)return fail('Cannot access another user.',403);
 const db=localAccountDatabase();if(!db)return fail('Database unavailable.',503);
 let stage:string=action;
 try{
  if(action==='buyer-interest'||action==='get-buyer-interest'){
   stage='interest-categories';
   const [categories]=await db.execute<RowDataPacket[]>('SELECT interest_category_id AS id,uuid,name,color,file_id,status,created_at,updated_at FROM interest_categories ORDER BY interest_category_id DESC LIMIT 1000');
   stage='interest-subcategories';
   const [subs]=await db.execute<RowDataPacket[]>('SELECT interest_sub_category_id AS id,uuid,name,interest_category_id,status,created_at,updated_at FROM interest_sub_categories ORDER BY interest_sub_category_id ASC LIMIT 5000');
   if(action==='buyer-interest'){
    const tree=bulk111InterestTree(categories,subs);
    return respond({categories:tree.categories,subCategories:tree.subCategories});
   }
   stage='selected-interests';
   const [selected]=await db.execute<RowDataPacket[]>('SELECT core_activity_id,activity_id FROM buyerinterests WHERE buyer_id=? ORDER BY core_activity_id ASC,activity_id ASC LIMIT 5000',[identity.id]);
   return respond(bulk111InterestTree(categories,subs,selected));
  }
  if(action==='get-itemtype'){
   stage='categories';
   const [categories]=await db.execute<RowDataPacket[]>('SELECT category_id AS id,name FROM categories WHERE status=1 AND is_delete=0 ORDER BY category_id ASC LIMIT 1000');
   stage='sub-categories';
   const [groups]=await db.execute<RowDataPacket[]>('SELECT sub_category_id AS id,name,category FROM sub_categories WHERE status=1 AND is_delete=0 ORDER BY sub_category_id ASC LIMIT 5000');
   stage='item-categories';
   const [items]=await db.execute<RowDataPacket[]>('SELECT item_category_id AS id,name,slug,subcategory_id,category_id FROM item_category WHERE status=1 AND is_delete=0 ORDER BY item_category_id ASC LIMIT 5000');
   stage='buyer-interest-counts';
   const [counts]=await db.execute<RowDataPacket[]>('SELECT item_category_id,COUNT(DISTINCT item_subcategory_id) AS count FROM buyer_sourcing_interests WHERE user_id=? GROUP BY item_category_id LIMIT 5000',[identity.id]);
   return respond(bulk111ItemTree(categories,groups,items,counts));
  }
  if(action==='get-item-subcategory'){
   stage='item-subcategories';
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT sc.item_subcategory_id AS id,sc.name,sc.slug,sc.item_category_id,sc.category_id,sc.subcategory_id,
    (CASE WHEN EXISTS (SELECT 1 FROM buyer_sourcing_interests b WHERE b.user_id=? AND b.item_category_id=sc.item_category_id AND b.item_subcategory_id=sc.item_subcategory_id) THEN 1 ELSE 0 END) AS checked
    FROM item_subcategory sc WHERE sc.status=1 AND sc.is_delete=0 AND sc.item_category_id=? ORDER BY sc.item_subcategory_id ASC LIMIT 5000`,[identity.id,parsed.categoryId]);
   return respond(bulk111MarkChecked(rows));
  }
  if(action==='get-products'){
   stage='recommended-products';
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT p.product_id AS id,p.slug,p.title,p.short_description,p.item_category_id,p.item_subcategory_id,im.file AS image
    FROM products p LEFT JOIN upload_images im ON im.upload_image_id=p.file_id
    WHERE p.status=1 AND p.is_approve=1 AND p.is_delete=0 AND EXISTS
    (SELECT 1 FROM buyer_sourcing_interests b WHERE b.user_id=? AND b.item_category_id=p.item_category_id AND b.item_subcategory_id=p.item_subcategory_id)
    ORDER BY p.product_id DESC LIMIT 10`,[identity.id]);
   return respond({status:true,message:rows.length?'Products fetched successfully':'No matched products found',data:rows.map((row:RowDataPacket)=>({id:row.id,slug:row.slug,title:row.title,short_description:row.short_description,item_category_id:row.item_category_id,item_subcategory_id:row.item_subcategory_id,file:row.image?{file:row.image}:null}))});
  }
  if(action==='get-seller-company'){
   stage='matched-companies';
   // The legacy controller queries an absent CompanyInfo.sub_category field; this
   // safe replacement matches companies through their approved matching products.
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT c.company_id AS id,c.organization_name,c.organization_slug,c.company_website,c.company_email,im.file AS logo
    FROM (SELECT DISTINCT p.company_id FROM buyer_sourcing_interests b
      JOIN products p ON p.item_category_id=b.item_category_id AND p.item_subcategory_id=b.item_subcategory_id
      WHERE b.user_id=? AND p.status=1 AND p.is_approve=1 AND p.is_delete=0
      ORDER BY p.company_id DESC LIMIT 100) matches
    JOIN company_info c ON c.company_id=matches.company_id
    LEFT JOIN upload_images im ON im.upload_image_id=c.company_logo
    ORDER BY c.company_id DESC`,[identity.id]);
   return respond({status:true,message:rows.length?'Companies fetched successfully':'No matching companies found',data:rows.map((row:RowDataPacket)=>({id:row.id,organization_name:row.organization_name,organization_slug:row.organization_slug,company_website:row.company_website,company_email:row.company_email,companyLogo:row.logo?{file:row.logo}:null}))});
  }
  return fail('Unknown dashboard endpoint.',404);
 }catch(e){return stageError(e,stage);}
}

async function bulk111WriteInterests(conn:PoolConnection,id:number,pairs:[number,number][]):Promise<void>{
 const groups=new Map<number,number[]>();for(const [cat,sub] of pairs){if(!groups.has(cat))groups.set(cat,[]);groups.get(cat)!.push(sub);}
 // Verify every category/subcategory relation before deleting prior state.
 for(const [cat,ids] of groups){
  const [found]=await conn.execute<RowDataPacket[]>(`SELECT interest_sub_category_id AS id FROM interest_sub_categories
    WHERE interest_category_id=? AND status=1 AND interest_sub_category_id IN (${ids.map(()=>'?').join(',')})`,[cat,...ids]);
  if(found.length!==ids.length)throw new Error('INVALID_INTEREST_SELECTION');
 }
 await conn.execute('DELETE FROM buyerinterests WHERE buyer_id=?',[id]);
 const placeholders=pairs.map(()=>'(?,?,?,?,NOW(),NOW())').join(',');
 await conn.execute(`INSERT INTO buyerinterests (uuid,buyer_id,core_activity_id,activity_id,created_at,updated_at) VALUES ${placeholders}`,
  pairs.flatMap(([cat,sub])=>[randomUUID(),id,cat,sub]));
 await conn.execute('UPDATE users SET is_intrest=1,updated_at=NOW() WHERE user_id=? AND is_seller=0 AND status=1 AND is_delete=0',[id]);
}
async function bulk111WriteSourcing(conn:PoolConnection,id:number,data:{categoryId:number;ids:number[];action:'add'|'remove'|'replace'}):Promise<void>{
 const {categoryId,ids,action}=data;
 const [activeCat]=await conn.execute<RowDataPacket[]>('SELECT item_category_id FROM item_category WHERE item_category_id=? AND status=1 AND is_delete=0 LIMIT 1',[categoryId]);
 if(!activeCat.length)throw new Error('INVALID_SOURCING_SELECTION');
 const [found]=await conn.execute<RowDataPacket[]>(`SELECT item_subcategory_id AS id FROM item_subcategory WHERE item_category_id=? AND status=1 AND is_delete=0 AND item_subcategory_id IN (${ids.map(()=>'?').join(',')})`,[categoryId,...ids]);
 if(found.length!==ids.length)throw new Error('INVALID_SOURCING_SELECTION');
 const [existing]=await conn.execute<RowDataPacket[]>('SELECT item_subcategory_id AS id FROM buyer_sourcing_interests WHERE user_id=? AND item_category_id=? FOR UPDATE',[id,categoryId]);
 const old:Set<number>=new Set(existing.map((r:RowDataPacket)=>Number(r.id)));const selected:Set<number>=new Set(ids);
 const remove=action==='remove'?ids:action==='replace'?[...old].filter(x=>!selected.has(x)):[];
 const add=action==='remove'?[]:ids.filter(x=>!old.has(x));
 if(remove.length)await conn.execute(`DELETE FROM buyer_sourcing_interests WHERE user_id=? AND item_category_id=? AND item_subcategory_id IN (${remove.map(()=>'?').join(',')})`,[id,categoryId,...remove]);
 if(add.length)await conn.execute(`INSERT INTO buyer_sourcing_interests (uuid,user_id,item_category_id,item_subcategory_id,created_at,updated_at) VALUES ${add.map(()=>'(?,?,?,?,NOW(),NOW())').join(',')}`,
  add.flatMap(sub=>[randomUUID(),id,categoryId,sub]));
 await conn.execute('UPDATE users SET is_intrest=1,updated_at=NOW() WHERE user_id=? AND is_seller=0 AND status=1 AND is_delete=0',[id]);
}
export async function bulk111Write(req:Request,action:PostAction):Promise<Response>{
 const identity=await loggedBuyer(req);if(identity instanceof Response)return identity;
 if(!sameOrigin(req))return fail('Origin mismatch.',403);
 // No writes to existing live database by default. Never opt in on production.
 if(process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED!=='true')return fail('Buyer dashboard writes disabled. Use a disposable local test database for write verification.',503);
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return fail('JSON content-type required.',415);
 if(Number(req.headers.get('content-length')||0)>16384)return fail('Payload too large.',413);
 let input:unknown;try{const raw=await req.text();if(Buffer.byteLength(raw,'utf8')>16384)return fail('Payload too large.',413);input=JSON.parse(raw);}catch{return fail('Invalid JSON payload.',400);}
 const body=action==='store-buyer-interest'?bulk111InterestBody(input,identity.id):bulk111SourcingBody(input,identity.id);
 if(!body)return fail('Invalid or unauthorized interest selection.',400);
 const db=localAccountDatabase();if(!db)return fail('Database unavailable.',503);
 let conn:PoolConnection|null=null;let started=false;
 try{
  conn=await db.getConnection();await conn.beginTransaction();started=true;
  // Re-check and lock the current buyer row inside the write transaction.
  const [ownerRows]=await conn.execute<RowDataPacket[]>('SELECT user_id FROM users WHERE user_id=? AND is_seller=0 AND status=1 AND is_delete=0 FOR UPDATE',[identity.id]);
  if(!ownerRows.length)throw new Error('OWNER_UNAVAILABLE');
  if(action==='store-buyer-interest')await bulk111WriteInterests(conn,identity.id,(body as NonNullable<ReturnType<typeof bulk111InterestBody>>).pairs);
  else await bulk111WriteSourcing(conn,identity.id,body as NonNullable<ReturnType<typeof bulk111SourcingBody>>);
  await conn.commit();started=false;
  return respond({success:true,message:action==='store-buyer-interest'?'Interest Added Successfully':'Buyer sourcing interests updated successfully'});
 }catch(e){
  if(started&&conn)await conn.rollback().catch(()=>{});
  if(e instanceof Error&&e.message==='OWNER_UNAVAILABLE')return fail('Please sign in again.',401);
  if(e instanceof Error&&(e.message==='INVALID_INTEREST_SELECTION'||e.message==='INVALID_SOURCING_SELECTION'))return fail('Invalid category or subcategory selection.',400);
  return stageError(e,'write-transaction');
 }finally{conn?.release();}
}
