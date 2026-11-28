/** BULK144: interest_sub_categories, 11 Express routes. GET parity checked against legacy;
 * authenticated writes intentionally restricted to a separately configured local QA database.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket, ResultSetHeader, PoolConnection} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>reply({error:'Database unavailable'},503);
const notFound=()=>reply({message:'Interest sub category not found'},404);
const pool=()=>localAccountDatabase();
const id=(s:string)=>/^[1-9]\d{0,14}$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const dateSql=(column:'created_at'|'updated_at',alias='s')=>`CASE WHEN ${alias}.${column} IS NULL THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(${alias}.${column},INTERVAL TIMESTAMPDIFF(SECOND,NOW(),UTC_TIMESTAMP()) SECOND),'%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${column}`;
const fields=`s.interest_sub_category_id AS id,s.uuid,s.name,s.interest_category_id,s.status,${dateSql('created_at')},${dateSql('updated_at')}`;
const table='FROM interest_sub_categories s';
const join=`${table} LEFT JOIN interest_categories c ON c.interest_category_id=s.interest_category_id`;
type SubRow=RowDataPacket & {id:number; uuid:string; name:string; interest_category_id:number; status:number; created_at:string|null; updated_at:string|null; category_name?:string|null};

export function interestSubcategoriesQaGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_INTEREST_SUBCATEGORIES_QA_WRITES_ENABLED!=='1')return reply({message:'Interest subcategory writes disabled.'},403);
 const name=env.DB_NAME??'',host=(env.DB_HOST??'').toLowerCase();
 if(!name||name!==env.SOURCEINDIA_INTEREST_SUBCATEGORIES_QA_DB_NAME||!/(qa|test|sandbox)/i.test(name)||!['localhost','127.0.0.1','::1'].includes(host))return reply({message:'Isolated local QA database required.'},403);
 const secret=env.SOURCEINDIA_INTEREST_SUBCATEGORIES_QA_TOKEN??'',authorization=req.headers.get('authorization')??'',token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(secret),Buffer.from(token)))return reply({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return reply({message:'Origin denied.'},403);}catch{return reply({message:'Origin denied.'},403);}}
 return null;
}
async function transaction<T>(fn:(connection:PoolConnection)=>Promise<T>):Promise<T>{const db=pool();if(!db)throw Error('DB_UNAVAILABLE');const connection=await db.getConnection();try{await connection.beginTransaction();const result=await fn(connection);await connection.commit();return result;}catch(error){await connection.rollback().catch(()=>{});throw error;}finally{connection.release();}}
async function findOne(handle:PoolConnection,idValue:number){const [rows]=await handle.execute<SubRow[]>(`SELECT ${fields} ${table} WHERE s.interest_sub_category_id=? LIMIT 1`,[idValue]);return rows[0]??null;}
async function body(req:NextRequest){if(Number(req.headers.get('content-length')??0)>8192)return null;const type=(req.headers.get('content-type')??'').toLowerCase();try{let value:unknown;if(type.startsWith('application/json'))value=await req.json();else if(type.startsWith('application/x-www-form-urlencoded')){const result:Record<string,string>={};for(const [k,v] of new URLSearchParams(await req.text())){if(Object.hasOwn(result,k))return null;result[k]=v;}value=result;}else return null;return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}catch{return null;}}
function inputs(input:Record<string,unknown>|null){if(!input)return null;const name=input.name,category=Number(input.interest_category_id),status=Number(input.status);if(typeof name!=='string'||!name.trim()||name.length>255||!Number.isSafeInteger(category)||category<0||![0,1].includes(status))return null;return {name:name.trim(),category,status};}

export async function listInterestSubcategories(){const db=pool();if(!db)return unavailable();try{const [rows]=await db.query<SubRow[]>(`SELECT ${fields},c.name AS category_name ${join} ORDER BY s.interest_sub_category_id ASC`);return reply(rows.map(r=>({...r,getStatus:Number(r.status)===1?'Active':'Inactive',category_name:r.category_name||null})));}catch{return unavailable();}}
export async function interestSubcategoriesCount(){const db=pool();if(!db)return unavailable();try{const [rows]=await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM interest_sub_categories');return reply({total:rows[0]?.total??0});}catch{return unavailable();}}
export async function getInterestSubcategory(raw:string){const item=id(raw);if(item===null)return notFound();const db=pool();if(!db)return unavailable();try{const [rows]=await db.execute<SubRow[]>(`SELECT ${fields} ${table} WHERE s.interest_sub_category_id=? LIMIT 1`,[item]);return rows.length?reply(rows[0]):notFound();}catch{return unavailable();}}
export async function interestSubcategoriesByCategory(raw:string){const category=id(raw);if(category===null)return reply([]);const db=pool();if(!db)return unavailable();try{const [rows]=await db.execute<SubRow[]>(`SELECT ${fields} ${table} WHERE s.interest_category_id=? ORDER BY s.interest_sub_category_id ASC`,[category]);return reply(rows);}catch{return unavailable();}}
// Reproduces original Express count_relation SELECT, including its intentionally loose grouping.
export async function interestSubcategoriesCountRelation(){const db=pool();if(!db)return unavailable();try{const [rows]=await db.query<RowDataPacket[]>(`SELECT buyerinterests.*, interest_sub_categories.name AS name, interest_sub_categories.interest_sub_category_id AS id, COUNT(buyerinterests.buyer_id) AS company_count
FROM buyerinterests LEFT JOIN interest_sub_categories ON buyerinterests.activity_id=interest_sub_categories.interest_sub_category_id
LEFT JOIN company_info ON buyerinterests.buyer_id=company_info.company_id
WHERE buyerinterests.buyer_id IN (
 SELECT users.user_id AS u_id FROM company_info
 JOIN users ON users.company_id=company_info.company_id
 JOIN cities ON users.city=cities.city_id JOIN states ON users.state=states.state_id
 JOIN countries ON users.country=countries.country_id
 LEFT JOIN upload_images ON upload_images.upload_image_id=users.company_file_id
 JOIN buyerinterests ON buyerinterests.buyer_id=users.user_id
 WHERE users.status=1 AND users.is_approve=1 AND users.is_seller=0 AND company_info.is_delete=0
) GROUP BY interest_sub_categories.name`);return reply(rows);}catch{return unavailable();}}
export async function interestSubcategoriesServerSide(req:NextRequest){const db=pool();if(!db)return unavailable();const q=req.nextUrl.searchParams;
 const page=Number(q.get('page')??'1'),limit=Number(q.get('limit')??'10'),search=q.get('search')??'',sortBy=q.get('sortBy')??'id';
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>500||search.length>255)return reply({message:'Invalid pagination or search'},400);
 const orderColumns:Record<string,string>={id:'s.interest_sub_category_id',name:'s.name',created_at:'s.created_at',updated_at:'s.updated_at',category_name:'c.name'};
 const order=orderColumns[sortBy]??'s.interest_sub_category_id',direction=['ASC','DESC'].includes(q.get('sort')??'DESC')?(q.get('sort')??'DESC'):'ASC';
 const where=search?'WHERE (s.name LIKE ? OR c.name LIKE ?)':'',args=search?['%'+search+'%','%'+search+'%']:[];
 try{const [[total],[filtered],[rows]]=await Promise.all([
 db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM interest_sub_categories'),
 db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${join} ${where}`,args),
 db.execute<SubRow[]>(`SELECT s.interest_sub_category_id AS id,s.name,s.interest_category_id,c.name AS category_name,s.status,${dateSql('created_at')},${dateSql('updated_at')} ${join} ${where} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...args,limit,(page-1)*limit])]);
 return reply({data:rows,totalRecords:total[0]?.total??0,filteredRecords:filtered[0]?.total??0});}catch{return unavailable();}}
export async function createInterestSubcategory(req:NextRequest){const blocked=interestSubcategoriesQaGate(req);if(blocked)return blocked;const data=inputs(await body(req));if(!data)return reply({message:'Invalid interest subcategory data'},400);
 try{const record=await transaction(async c=>{const [insert]=await c.execute<ResultSetHeader>('INSERT INTO interest_sub_categories (uuid,name,interest_category_id,status,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())',[randomUUID(),data.name,data.category,data.status]);return findOne(c,insert.insertId);});return reply({message:'Interest sub category created',interestSubCategories:record},201);}catch{return unavailable();}}
export async function updateInterestSubcategory(req:NextRequest,raw:string){const blocked=interestSubcategoriesQaGate(req);if(blocked)return blocked;const item=id(raw);if(item===null)return notFound();const data=inputs(await body(req));if(!data)return reply({message:'Invalid interest subcategory data'},400);
 try{return await transaction(async c=>{if(!await findOne(c,item))return notFound();await c.execute('UPDATE interest_sub_categories SET name=?,interest_category_id=?,status=?,updated_at=NOW() WHERE interest_sub_category_id=?',[data.name,data.category,data.status,item]);return reply({message:'Interest sub category updated',interestSubCategories:await findOne(c,item)});});}catch{return unavailable();}}
export async function deleteInterestSubcategory(req:NextRequest,raw:string){const blocked=interestSubcategoriesQaGate(req);if(blocked)return blocked;const item=id(raw);if(item===null)return notFound();try{return await transaction(async c=>{if(!await findOne(c,item))return notFound();await c.execute('DELETE FROM interest_sub_categories WHERE interest_sub_category_id=?',[item]);return reply({message:'Interest sub category deleted successfully'});});}catch{return unavailable();}}
export async function deleteSelectedInterestSubcategories(req:NextRequest){const blocked=interestSubcategoriesQaGate(req);if(blocked)return blocked;const input=await body(req),raw=input?.ids;if(!Array.isArray(raw)||raw.length<1||raw.length>500)return reply({message:'Please provide an array of IDs to delete.'},400);
 const ids=[...new Set(raw.map(v=>id(String(v))))];if(ids.some(v=>v===null))return reply({message:'Invalid IDs'},400);const safeIds=ids as number[];
 try{return await transaction(async c=>{const placeholders=safeIds.map(()=>'?').join(',');const [found]=await c.execute<RowDataPacket[]>(`SELECT interest_sub_category_id FROM interest_sub_categories WHERE interest_sub_category_id IN (${placeholders}) FOR UPDATE`,safeIds);if(!found.length)return reply({message:'No sub admin found with the given IDs.'},404);await c.execute(`DELETE FROM interest_sub_categories WHERE interest_sub_category_id IN (${placeholders})`,safeIds);return reply({message:`${found.length} sub admin deleted successfully.`});});}catch{return unavailable();}}
export async function updateInterestSubcategoryStatus(req:NextRequest,raw:string){const blocked=interestSubcategoriesQaGate(req);if(blocked)return blocked;const item=id(raw);if(item===null)return notFound();const input=await body(req),status=input?.status;if(status!==0&&status!==1)return reply({message:'Invalid status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await transaction(async c=>{if(!await findOne(c,item))return notFound();await c.execute('UPDATE interest_sub_categories SET status=?,updated_at=NOW() WHERE interest_sub_category_id=?',[status,item]);return reply({message:'Status updated',interestSubCategories:await findOne(c,item)});});}catch{return unavailable();}}
