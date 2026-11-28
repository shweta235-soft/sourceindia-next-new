/** BULK139: QA-only home banner multipart writes. Original DB and legacy assets are untouchable.
 * Express contract reference: legacy/sourceindia-express/controllers/homeBannerController.js.
 * Only QA-owned banner images can be modified or deleted.
 */
import type {NextRequest} from 'next/server';
import type {PoolConnection, RowDataPacket, ResultSetHeader} from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
import {mkdir, writeFile, unlink, readFile} from 'node:fs/promises';
import {join, resolve, isAbsolute, basename} from 'node:path';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const MAX_IMAGE=2*1024*1024;
const MAX_FORM=3*1024*1024;
const owned=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpe?g|gif|webp)$/i;
const contentType:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'};
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const reject=(message:string,status=400)=>response({message},status);
const asId=(raw:string)=>/^[1-9]\d{0,14}$/.test(raw)&&Number.isSafeInteger(Number(raw))?Number(raw):null;
function qaRoot():string|null {
 const raw=process.env.SOURCEINDIA_BANNERS_QA_STORAGE_ROOT;
 if(!raw||!isAbsolute(raw))return null;
 const path=resolve(raw);
 if(!/(^|[\\/])(qa|test|sandbox)([\\/]|$)/i.test(path))return null;
 if(path===resolve('.')||path===resolve('upload')||path===resolve('public')||path===resolve('..'))return null;
 return path;
}
export function bannerQaStorageRoot(){return qaRoot();}
function ownedFilePath(file:unknown){
 if(typeof file!=='string')return null;
 const prefix='upload/home_banners/';
 if(!file.startsWith(prefix))return null;
 const name=file.slice(prefix.length);
 return owned.test(name)&&basename(name)===name?name:null;
}
function imageSignature(name:string,mime:string,bytes:Uint8Array){
 if(bytes.length<12||bytes.length>MAX_IMAGE)return null;
 const ext=name.toLowerCase().match(/\.([a-z]+)$/)?.[1]??'';
 if(!Object.hasOwn(contentType,ext)||contentType[ext]!==mime.toLowerCase())return null;
 const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const gif=String.fromCharCode(...bytes.subarray(0,6))==='GIF89a'||String.fromCharCode(...bytes.subarray(0,6))==='GIF87a';
 const webp=String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP';
 const ok=ext==='png'?png:(ext==='jpg'||ext==='jpeg')?jpg:ext==='gif'?gif:webp;
 return ok?ext:null;
}
function textValue(form:FormData,key:string){
 const all=form.getAll(key);
 if(all.length>1||all.some(v=>typeof v!=='string'))throw Error('Invalid or duplicate field: '+key);
 const value=all.length?String(all[0]):null;
 if(value!==null&&value.length>(key==='description'?20000:255))throw Error('Field too long: '+key);
 return value;
}
async function parseForm(req:NextRequest,requiresFile:boolean){
 const length=Number(req.headers.get('content-length')??0);
 if(!Number.isSafeInteger(length)||length<0||length>MAX_FORM)return {error:reject('Multipart request too large',413)} as const;
 if(!(req.headers.get('content-type')??'').toLowerCase().startsWith('multipart/form-data'))return {error:reject('Expected multipart/form-data',415)} as const;
 let form:FormData;
 try{form=await req.formData();}catch{return {error:reject('Malformed multipart data')} as const;}
 try{
  for(const key of form.keys())if(!['file','title','sub_title','description','button_text','button_url','status'].includes(key))throw Error('Unexpected field: '+key);
  const fileParts=form.getAll('file');
  if(fileParts.length>1)throw Error('Only one image allowed');
  const part=fileParts[0];
  if(requiresFile&&!(part instanceof File))throw Error('Image file is required');
  if(part!==undefined&&!(part instanceof File))throw Error('Invalid image field');
  const file=part instanceof File?part:null;
  if(file&&file.size>MAX_IMAGE)return {error:reject('Image must be at most 2 MB',413)} as const;
  const bytes=file?new Uint8Array(await file.arrayBuffer()):null;
  const ext=file&&bytes?imageSignature(file.name,file.type,bytes):null;
  if(file&&!ext)throw Error('Invalid image type or signature');
  const values={title:textValue(form,'title'),sub_title:textValue(form,'sub_title'),description:textValue(form,'description'),button_text:textValue(form,'button_text'),button_url:textValue(form,'button_url')};
  const rawStatus=textValue(form,'status');
  // Express create defaults to active; Express update rejects falsy status including 0.
  if(rawStatus!==null&&!['0','1'].includes(rawStatus))throw Error('Invalid banner status');
  if(!requiresFile&&(!rawStatus||rawStatus==='0'))return {error:reject('All fields (title, sub_title, description, button_text, button_url, status) are required')} as const;
  return {data:{values,status:rawStatus===null?1:Number(rawStatus),bytes,ext}} as const;
 }catch(e){return {error:reject(e instanceof Error?e.message:'Invalid multipart data')} as const;}
}
function db(){return localAccountDatabase();}
async function storedImage(bytes:Uint8Array,ext:string,root:string){
 const filename=`${randomUUID()}.${ext}`;
 const folder=join(root,'home_banners');
 await mkdir(folder,{recursive:true});
 const abs=join(folder,filename);
 await writeFile(abs,bytes,{flag:'wx',mode:0o600});
 return {abs,dbpath:`upload/home_banners/${filename}`};
}
async function removeSafely(path:string|null){if(path)await unlink(path).catch(()=>{});}
function fileOnDisk(root:string,dbpath:unknown){const name=ownedFilePath(dbpath);return name?join(root,'home_banners',name):null;}
async function rowById(conn:PoolConnection,id:number){
 const [rows]=await conn.execute<RowDataPacket[]>('SELECT home_banner_id AS id,uuid,title,sub_title,description,button_text,button_url,file_id,status,is_delete,created_at,updated_at FROM home_banners WHERE home_banner_id=? LIMIT 1',[id]);
 return rows[0]??null;
}
export async function createQaBanner(req:NextRequest){
 const root=qaRoot();if(!root)return reject('Isolated QA storage required',403);
 const parsed=await parseForm(req,true);if('error' in parsed)return parsed.error;
 const data=parsed.data; if(!data.bytes||!data.ext)return reject('Image file is required');
 const pool=db();if(!pool)return reject('QA database unavailable',503);
 let stored:Awaited<ReturnType<typeof storedImage>>|null=null,conn:PoolConnection|null=null;
 try{
  stored=await storedImage(data.bytes,data.ext,root);
  conn=await pool.getConnection();await conn.beginTransaction();
  const [upload]=await conn.execute<ResultSetHeader>('INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())',[randomUUID(),stored.dbpath]);
  const v=data.values;
  const [banner]=await conn.execute<ResultSetHeader>('INSERT INTO home_banners (uuid,title,sub_title,description,button_text,button_url,file_id,status,is_delete,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,NOW(),NOW())',[randomUUID(),v.title,v.sub_title,v.description,v.button_text,v.button_url,upload.insertId,data.status]);
  const row=await rowById(conn,banner.insertId);
  await conn.commit();conn.release();conn=null;
  return response({message:'Home Banner created',homeBanners:row},201);
 }catch{if(conn){await conn.rollback().catch(()=>{});conn.release();}await removeSafely(stored?.abs??null);return reject('QA home banner create failed',503);}
}
export async function updateQaBanner(req:NextRequest,raw:string){
 const id=asId(raw);if(id===null)return reject('Home Banners not found',404);
 const root=qaRoot();if(!root)return reject('Isolated QA storage required',403);
 const parsed=await parseForm(req,false);if('error' in parsed)return parsed.error;
 const pool=db();if(!pool)return reject('QA database unavailable',503);
 const data=parsed.data;
 let conn:PoolConnection|null=null,stored:Awaited<ReturnType<typeof storedImage>>|null=null,oldDisk:string|null=null;
 try{
  conn=await pool.getConnection();await conn.beginTransaction();
  const [rows]=await conn.execute<RowDataPacket[]>('SELECT b.home_banner_id AS id,b.file_id,i.file FROM home_banners b LEFT JOIN upload_images i ON i.upload_image_id=b.file_id WHERE b.home_banner_id=? FOR UPDATE',[id]);
  if(!rows.length){await conn.rollback();conn.release();return reject('Home Banners not found',404);}
  // Never modify an original/legacy banner; all writable QA assets must have an owned UUID path.
  if(!ownedFilePath(rows[0].file)){await conn.rollback();conn.release();return reject('Banner is not QA-owned; refusing update',403);}
  let imageId=Number(rows[0].file_id);
  if(data.bytes&&data.ext){
   stored=await storedImage(data.bytes,data.ext,root);
   oldDisk=fileOnDisk(root,rows[0].file);
   await conn.execute('UPDATE upload_images SET file=?,updated_at=NOW() WHERE upload_image_id=?',[stored.dbpath,imageId]);
  }
  const v=data.values;
  await conn.execute('UPDATE home_banners SET title=?,sub_title=?,description=?,button_text=?,button_url=?,status=?,updated_at=NOW() WHERE home_banner_id=?',[v.title,v.sub_title,v.description,v.button_text,v.button_url,data.status,id]);
  const row=await rowById(conn,id);
  await conn.commit();conn.release();conn=null;
  if(stored)await removeSafely(oldDisk);
  return response({message:'Home Banner updated',homeBanners:row});
 }catch{if(conn){await conn.rollback().catch(()=>{});conn.release();}await removeSafely(stored?.abs??null);return reject('QA home banner update failed',503);}
}
export async function deleteQaBanner(_req:NextRequest,raw:string){
 const id=asId(raw);if(id===null)return reject('Home Banners not found',404);
 const root=qaRoot();if(!root)return reject('Isolated QA storage required',403);
 const pool=db();if(!pool)return reject('QA database unavailable',503);
 let conn:PoolConnection|null=null;
 try{
  conn=await pool.getConnection();await conn.beginTransaction();
  const [rows]=await conn.execute<RowDataPacket[]>('SELECT b.home_banner_id AS id,b.file_id,i.file FROM home_banners b LEFT JOIN upload_images i ON i.upload_image_id=b.file_id WHERE b.home_banner_id=? FOR UPDATE',[id]);
  if(!rows.length){await conn.rollback();conn.release();return reject('Home Banners not found',404);}
  const dbpath=rows[0].file,abs=fileOnDisk(root,dbpath);
  if(!abs){await conn.rollback();conn.release();return reject('Banner is not QA-owned; refusing delete',403);}
  // Never delete a shared upload_images record. Ensure no other banners link to it.
  const [used]=await conn.execute<RowDataPacket[]>('SELECT COUNT(*) AS n FROM home_banners WHERE file_id=?',[rows[0].file_id]);
  if(Number(used[0]?.n)!==1){await conn.rollback();conn.release();return reject('Shared image cannot be deleted',409);}
  await conn.execute('DELETE FROM home_banners WHERE home_banner_id=?',[id]);
  await conn.execute('DELETE FROM upload_images WHERE upload_image_id=?',[rows[0].file_id]);
  await conn.commit();conn.release();conn=null;
  await removeSafely(abs);
  return response({message:'Home Banner deleted successfully'});
 }catch{if(conn){await conn.rollback().catch(()=>{});conn.release();}return reject('QA home banner delete failed',503);}
}
export async function serveQaBanner(filename:string){
 const root=qaRoot();if(!root||!owned.test(filename)||basename(filename)!==filename)return new Response(null,{status:404});
 try{
  const bytes=await readFile(join(root,'home_banners',filename));
  if(bytes.length>MAX_IMAGE)return new Response(null,{status:404});
  const ext=filename.split('.').pop()?.toLowerCase()??'';
  if(!imageSignature(filename,contentType[ext]??'',bytes))return new Response(null,{status:404});
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':contentType[ext],'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404});}
}
