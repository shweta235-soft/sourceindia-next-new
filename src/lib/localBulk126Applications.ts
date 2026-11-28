/** BULK126 native Applications API. Legacy backend is read-only reference.
 * GET endpoints mirror legacy response shapes. Writes are QA-only; file-bearing
 * writes and destructive filesystem operations remain deliberately disabled.
 */
import type {NextRequest} from 'next/server';
import type {PoolConnection,RowDataPacket,ResultSetHeader} from 'mysql2/promise';
import {timingSafeEqual, randomUUID} from 'node:crypto';
import {applicationImage,applicationQaRoot,writeApplicationImage,discardApplicationImage,quarantineApplicationImage,restoreApplicationImage,disposeApplicationImage, type ApplicationUpload,type QuarantinedFile} from '@/lib/localBulk126ApplicationFiles';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
const bad=()=>json({message:'Invalid request.'},400);
const missing=()=>json({message:'Applications unavailable.'},503);
const idNum=(x:string)=>/^[1-9]\d{0,14}$/.test(x)&&Number.isSafeInteger(Number(x))?Number(x):null;
const cols='a.application_id AS id,a.uuid,a.name,a.cat_file_id,a.stock_file_id,a.prefix,a.status,a.top_category,a.is_delete,a.created_at,a.updated_at';
const sortCols:Record<string,string>={application_id:'a.application_id',name:'a.name',top_category:'a.top_category',created_at:'a.created_at',updated_at:'a.updated_at'};
const escapeLike=(x:string)=>x.replace(/[\\%_]/g,c=>'\\'+c);
export async function listApplications():Promise<Response>{
 const db=localAccountDatabase();if(!db)return missing();
 try{const [r]=await db.query<RowDataPacket[]>(`SELECT ${cols} FROM applications a ORDER BY a.application_id ASC`);return json(r.map(x=>({...x,getStatus:Number(x.status)===1?'Active':'Inactive'})));}catch{return missing();}
}
export async function countApplications():Promise<Response>{
 const db=localAccountDatabase();if(!db)return missing();
 try{const [r]=await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM applications WHERE is_delete=0');return json({total:Number(r[0]?.total??0)});}catch{return missing();}
}
export async function detailApplications(raw:string):Promise<Response>{
 const id=idNum(raw);if(!id)return bad();const db=localAccountDatabase();if(!db)return missing();
 try{const [r]=await db.execute<RowDataPacket[]>(`SELECT ${cols},u.file AS _file FROM applications a LEFT JOIN upload_images u ON u.upload_image_id=a.cat_file_id WHERE a.application_id=? LIMIT 1`,[id]);
 if(!r[0])return json({message:'Application not found'},404);
 const {_file,...fields}=r[0];return json({...fields,UploadImage:_file==null?null:{file:_file},file_name:_file??null});}catch{return missing();}
}
function dateBounds(p:URLSearchParams):[string,string]|null|false{
 const raw=(p.get('dateRange')??'').toLowerCase().replace(/\s/g,'');if(!raw)return null;
 const today=new Date(),start=new Date(today),end=new Date(today);start.setHours(0,0,0,0);
 const setDays=(n:number)=>{start.setDate(start.getDate()-n);return [start.toISOString(),end.toISOString()] as [string,string];};
 if(raw==='today')return setDays(0);if(raw==='yesterday'){start.setDate(start.getDate()-1);end.setTime(start.getTime());end.setHours(23,59,59,999);return [start.toISOString(),end.toISOString()];}
 if(raw==='last7days')return setDays(6);if(raw==='last30days')return setDays(29);
 if(raw==='thismonth'){start.setDate(1);return [start.toISOString(),end.toISOString()];}
 if(raw==='lastmonth'){start.setDate(1);start.setMonth(start.getMonth()-1);end.setDate(0);end.setHours(23,59,59,999);return [start.toISOString(),end.toISOString()];}
 if(raw==='customrange'){const a=p.get('startDate'),b=p.get('endDate');if(!a||!b||!/^\d{4}-\d\d-\d\d$/.test(a)||!/^\d{4}-\d\d-\d\d$/.test(b))return false;const startDate=new Date(a+'T00:00:00'),endDate=new Date(b+'T23:59:59.999');if(!Number.isFinite(+startDate)||!Number.isFinite(+endDate)||+startDate>+endDate)return false;return [startDate.toISOString(),endDate.toISOString()];}
 if(/^[1-9]\d{0,3}$/.test(raw))return setDays(Number(raw)-1);return false;
}
export async function gridApplications(req:NextRequest):Promise<Response>{
 const p=new URL(req.url).searchParams;
 const pageStr=p.get('page')??'1',limitStr=p.get('limit')??'10';if(!/^[1-9]\d{0,5}$/.test(pageStr)||!/^[1-9]\d{0,3}$/.test(limitStr))return bad();
 const page=Number(pageStr),limit=Number(limitStr),offset=(page-1)*limit;
 if(limit>200||!Number.isSafeInteger(offset))return bad();
 const search=p.get('search')??'';if(search.length>160)return bad();const bounds=dateBounds(p);if(bounds===false)return bad();
 const deleted=p.get('getDeleted')==='true'?1:0;const sort=sortCols[p.get('sortBy')??'id']??sortCols.application_id;
 const direction=p.get('sort')==='ASC'?'ASC':p.get('sort')==='DESC'?'DESC':p.has('sort')?'ASC':'DESC';
 const clauses=['a.is_delete=?'];const args:unknown[]=[deleted];
 if(search){clauses.push('a.name LIKE ?');args.push('%'+escapeLike(search)+'%');}
 if(bounds){clauses.push('a.created_at BETWEEN ? AND ?');args.push(...bounds);}
 const where=clauses.join(' AND ');const db=localAccountDatabase();if(!db)return missing();
 try{const [total]=await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM applications WHERE is_delete=?',[deleted]);
 const [filtered]=await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM applications a WHERE ${where}`,args);
 const [rows]=await db.query<RowDataPacket[]>(`SELECT ${cols},u.file AS _file,(SELECT COUNT(*) FROM products p WHERE p.application=a.application_id) AS product_count FROM applications a LEFT JOIN upload_images u ON u.upload_image_id=a.cat_file_id WHERE ${where} ORDER BY ${sort} ${direction} LIMIT ? OFFSET ?`,[...args,limit,offset]);
 return json({data:rows.map(r=>({id:r.id,name:r.name,top_category:r.top_category,cat_file_id:r.cat_file_id,file_name:r._file??null,status:r.status,is_delete:r.is_delete,created_at:r.created_at,updated_at:r.updated_at,product_count:r.product_count})),totalRecords:Number(total[0]?.total??0),filteredRecords:Number(filtered[0]?.total??0)});
 }catch{return missing();}
}
/** Explicit isolated QA opt-in, denied on production even with credentials. */
export function applicationsWriteGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_APPLICATION_WRITES_ENABLED!=='1')return json({message:'Application writes disabled.'},403);
 if(!['localhost','127.0.0.1','::1'].includes((env.DB_HOST??'').toLowerCase()))return json({message:'Isolated QA database required.'},403);
 const db=env.DB_NAME??'';
 if(!db||db!==env.SOURCEINDIA_APPLICATION_QA_DB_NAME||!/(qa|test|sandbox)/i.test(db))return json({message:'Isolated QA database required.'},403);
 const secret=env.SOURCEINDIA_APPLICATION_QA_TOKEN??'',auth=req.headers.get('authorization')??'',value=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(value)||!timingSafeEqual(Buffer.from(secret),Buffer.from(value)))return json({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return json({message:'Origin denied.'},403);}catch{return json({message:'Origin denied.'},403);}}
 return null;
}
async function body(req:NextRequest):Promise<Record<string,unknown>|null>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return null;
 if(Number(req.headers.get('content-length')??'0')>16000)return null;
 try{const x:unknown=await req.json();return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;}catch{return null;}
}
const status=(value:unknown)=>value===0||value===1?value:null;
async function tx<T>(f:(conn:PoolConnection)=>Promise<T>):Promise<T>{const pool=localAccountDatabase();if(!pool)throw Error('No database');const c=await pool.getConnection();try{await c.beginTransaction();const result=await f(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
async function locked(c:PoolConnection,id:number){const [r]=await c.execute<RowDataPacket[]>(`SELECT ${cols} FROM applications a WHERE a.application_id=? FOR UPDATE`,[id]);return r[0]??null;}
/** Axios and React's create/edit forms submit multipart fields; optional edit image. */
type ApplicationForm={name:string;status:number;top_category:number;file:ApplicationUpload|null};
async function applicationForm(req:NextRequest,requiredImage:boolean):Promise<ApplicationForm|null>{
 const ct=req.headers.get('content-type')??'';
 if(!ct.toLowerCase().startsWith('multipart/form-data'))return null;
 const len=Number(req.headers.get('content-length')??0);
 if(!Number.isFinite(len)||len>7*1024*1024)return null;
 try{
  const form=await req.formData();
  for(const key of ['name','top_category','status','file'])if(form.getAll(key).length>1)return null;
  const name=form.get('name'),status=form.get('status'),category=form.get('top_category');
  if(typeof name!=='string'||!name.trim()||name.length>255)return null;
  if(status!=='0'&&status!=='1')return null;
  if(category!==null&&category!=='0'&&category!=='1'&&category!=='')return null;
  const raw=form.get('file');
  let file:ApplicationUpload|null=null;
  if(raw!==null&&raw!==''){
   if(typeof raw==='string'||raw.size===0)return null;
   file=await applicationImage(raw);
  }
  if(requiredImage&&!file)return null;
  return {name:name.trim(),status:Number(status),top_category:category?Number(category):0,file};
 }catch{return null;}
}
class ApplicationAbort extends Error{
 readonly code:number;readonly publicMessage:string;
 constructor(code:number,publicMessage:string){super(publicMessage);this.code=code;this.publicMessage=publicMessage;}
}
/** Transaction + reversible QA file operations. All filesystem changes remain
 * within SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT. */
async function fileMutation(fn:(conn:PoolConnection,ctx:{created:string[];trash:QuarantinedFile[]})=>Promise<Response>):Promise<Response>{
 const pool=localAccountDatabase();if(!pool)return missing();
 let conn:PoolConnection|null=null;let committed=false;
 const ctx:{created:string[];trash:QuarantinedFile[]}={created:[],trash:[]};
 try{
  conn=await pool.getConnection();await conn.beginTransaction();
  const result=await fn(conn,ctx);await conn.commit();committed=true;
  // A cleanup failure must not roll back an already committed DB operation.
  for(const stale of ctx.trash){try{await disposeApplicationImage(stale);}catch(error){console.error('BULK126 QA stale application file cleanup:',(error as Error).message);}}
  return result;
 }catch(error){
  if(!committed&&conn){try{await conn.rollback();}catch{}}
  if(!committed){
   for(const stale of ctx.trash.reverse()){try{await restoreApplicationImage(stale);}catch(e){console.error('BULK126 QA file restore error:',(e as Error).message);}}
   for(const created of ctx.created){try{await discardApplicationImage(created);}catch(e){console.error('BULK126 QA new file rollback cleanup error:',(e as Error).message);}}
  }
  if(error instanceof ApplicationAbort)return json({message:error.publicMessage},error.code);
  return missing();
 }finally{conn?.release();}
}
export async function createApplications(req:NextRequest):Promise<Response>{
 const denied=applicationsWriteGate(req);if(denied)return denied;
 const data=await applicationForm(req,true);if(!data||!data.file)return json({message:'Valid name, status and application image are required.'},400);
 try{applicationQaRoot();}catch{return json({message:'Isolated QA image storage not configured.'},403);}
 return fileMutation(async(c,ctx)=>{
  const file=data.file!;await writeApplicationImage(file);ctx.created.push(file.dbPath);
  const [img]=await c.execute<ResultSetHeader>('INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())',[randomUUID(),file.dbPath]);
  const [application]=await c.execute<ResultSetHeader>(`INSERT INTO applications (uuid,name,cat_file_id,status,top_category,is_delete,created_at,updated_at) VALUES (?,?,?,?,?,0,NOW(),NOW())`,[randomUUID(),data.name,img.insertId,data.status,data.top_category]);
  const row=await locked(c,application.insertId);
  if(!row)throw Error('APPLICATION_CREATE_ROW_MISSING');
  return json({message:'Application created',applications:row},201);
 });
}
export async function updateApplications(req:NextRequest,raw:string):Promise<Response>{
 const denied=applicationsWriteGate(req);if(denied)return denied;
 const id=idNum(raw);if(!id)return bad();
 const data=await applicationForm(req,false);if(!data)return json({message:'Valid multipart application fields are required.'},400);
 if(data.file){try{applicationQaRoot();}catch{return json({message:'Isolated QA image storage not configured.'},403);}}
 return fileMutation(async(c,ctx)=>{
  const before=await locked(c,id);if(!before)throw new ApplicationAbort(404,'Applications not found');
  let imageId=Number(before.cat_file_id??0);
  if(data.file){
   const file=data.file;
   await writeApplicationImage(file);ctx.created.push(file.dbPath);
   if(imageId>0){
    const [old]=await c.execute<RowDataPacket[]>('SELECT upload_image_id,file FROM upload_images WHERE upload_image_id=? FOR UPDATE',[imageId]);
    if(old[0]){
     const oldFile=String(old[0].file??'');
     // Never remove a shared image. Original code assumes each application owns its image.
     const [users]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS count FROM applications WHERE cat_file_id=?',[imageId]);
     if(Number(users[0]?.count??0)>1)throw new ApplicationAbort(409,'Shared application image requires manual QA reconciliation.');
     if(oldFile){const stale=await quarantineApplicationImage(oldFile);if(stale)ctx.trash.push(stale);}
     await c.execute('UPDATE upload_images SET file=?,updated_at=NOW() WHERE upload_image_id=?',[file.dbPath,imageId]);
    }else{imageId=0;}
   }
   if(!imageId){const [img]=await c.execute<ResultSetHeader>('INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())',[randomUUID(),file.dbPath]);imageId=img.insertId;}
  }
  await c.execute('UPDATE applications SET name=?,top_category=?,status=?,cat_file_id=?,updated_at=NOW() WHERE application_id=?',[data.name,data.top_category,data.status,imageId,id]);
  const updated=await locked(c,id);if(!updated)throw Error('APPLICATION_UPDATE_ROW_MISSING');
  return json({message:'Application updated',applications:updated});
 });
}
export async function patchApplications(req:NextRequest,raw:string,key:'status'|'top_category'|'is_delete'):Promise<Response>{const denied=applicationsWriteGate(req);if(denied)return denied;const id=idNum(raw);if(!id)return bad();const data=await body(req),value=status(data?.[key]);if(value===null)return json({message:key==='status'?'Invalid status. Use 1 (Active) or 0 (Deactive).':key==='top_category'?'Invalid category status. Use 1 (Active) or 0 (Deactive).':'Invalid delete status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await tx(async c=>{if(!await locked(c,id))return json({message:'Applications not found'},404);await c.execute(`UPDATE applications SET ${key}=?,updated_at=NOW() WHERE application_id=?`,[value,id]);return json({message:key==='status'?'Status updated':key==='top_category'?'Category status updated':'Applications is removed',applications:await locked(c,id)});});}catch{return missing();}}
export async function deleteApplications(req:NextRequest,raw:string):Promise<Response>{
 const denied=applicationsWriteGate(req);if(denied)return denied;
 const id=idNum(raw);if(!id)return bad();
 // Required for deleting a QA copied legacy image without touching original storage.
 try{applicationQaRoot();}catch{return json({message:'Isolated QA image storage not configured.'},403);}
 return fileMutation(async(c,ctx)=>{
  const application=await locked(c,id);if(!application)throw new ApplicationAbort(404,'Applications not found');
  const imageId=Number(application.cat_file_id??0);
  if(imageId>0){
   const [images]=await c.execute<RowDataPacket[]>('SELECT upload_image_id,file FROM upload_images WHERE upload_image_id=? FOR UPDATE',[imageId]);
   const [users]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS count FROM applications WHERE cat_file_id=?',[imageId]);
   if(Number(users[0]?.count??0)>1)throw new ApplicationAbort(409,'Shared application image requires manual QA reconciliation.');
   if(images[0]?.file){const stale=await quarantineApplicationImage(String(images[0].file));if(stale)ctx.trash.push(stale);}
  }
  await c.execute('DELETE FROM applications WHERE application_id=?',[id]);
  if(imageId>0)await c.execute('DELETE FROM upload_images WHERE upload_image_id=?',[imageId]);
  return json({message:'Application deleted successfully'});
 });
}
export async function deleteSelectedApplications(req:NextRequest):Promise<Response>{const denied=applicationsWriteGate(req);if(denied)return denied;
 const data=await body(req),ids=data?.ids;if(!Array.isArray(ids)||ids.length===0||ids.length>200)return json({message:'Please provide an array of IDs to update.'},400);
 const parsed=ids.map(v=>idNum(String(v)));if(parsed.some(v=>v===null)||new Set(parsed).size!==parsed.length)return bad();
 // Original uses an 'id' key while Sequelize maps it to application_id; test primary-key equivalence in QA.
 try{return await tx(async c=>{const marks=parsed.map(()=>'?').join(',');const [rows]=await c.query<RowDataPacket[]>(`SELECT application_id FROM applications WHERE application_id IN (${marks}) AND is_delete=0 FOR UPDATE`,parsed);
 if(!rows.length)return json({message:'No applications found with the given IDs.'},404);
 await c.query(`UPDATE applications SET is_delete=1,updated_at=NOW() WHERE application_id IN (${marks})`,parsed);
 return json({message:`${rows.length} applications marked as deleted.`});});}catch{return missing();}
}
export async function deleteCountApplications(req:NextRequest):Promise<Response>{const denied=applicationsWriteGate(req);if(denied)return denied;return countApplications();}
