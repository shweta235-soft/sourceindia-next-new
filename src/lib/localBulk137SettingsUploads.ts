/** BULK137: Settings image uploads, isolated QA only.
 * Legacy reference: controllers/settingController.js updateSiteSettings/updateHomeSettings.
 * Never write to the original React folder, the main DB, or production storage.
 */
import type {NextRequest} from 'next/server';
import type {PoolConnection,RowDataPacket,ResultSetHeader} from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
import {mkdir,lstat,realpath,readFile,unlink,writeFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
import {settingsImageType,settingsImageMime,settingsOwnedFilename,settingsOwnedDbPath,settingsQaRoot,SETTINGS_MULTIPART_MAX_BYTES} from '@/lib/localBulk137SettingsImages.mjs';

type SettingsTable='site_settings'|'home_settings';
type ImageField={name:string;idKey:string};
type FileToSave={field:ImageField;bytes:Uint8Array;extension:string};
type MultipartFields={texts:Record<string,string>;files:FileToSave[]};
const siteFields:ImageField[]=[{name:'logo_file',idKey:'logo_file_id'},{name:'favicon_file',idKey:'favicon_file_id'}];
const homeFields:ImageField[]=[{name:'about_file',idKey:'about_file_id'},{name:'footer_logo',idKey:'footer_logo_id'},{name:'footer_img_1',idKey:'footer_img_1_id'},{name:'footer_img_2',idKey:'footer_img_2_id'},{name:'popup_banner_file',idKey:'popup_banner_file_id'}];
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
class UploadAbort extends Error{constructor(readonly code:number, readonly publicMessage:string){super(publicMessage);}}
const fieldsFor=(table:SettingsTable)=>table==='site_settings'?siteFields:homeFields;

async function parseMultipart(req:NextRequest,table:SettingsTable):Promise<MultipartFields>{
 const rawLength=req.headers.get('content-length');
 if (!rawLength || !/^\d+$/.test(rawLength))throw new UploadAbort(411,'Content-Length is required for QA uploads.');
 const size=Number(rawLength);
 if (!Number.isSafeInteger(size)||size<=0||size>SETTINGS_MULTIPART_MAX_BYTES)throw new UploadAbort(413,'Settings upload exceeds the request limit.');
 const allowed=fieldsFor(table);
 let form:FormData;
 try{form=await req.formData();}catch{throw new UploadAbort(400,'Invalid multipart form.');}
 const texts:Record<string,string>=Object.create(null),files:FileToSave[]=[];
 const seen=new Set<string>();
 for(const [name,value] of form.entries()){
  if(seen.has(name))throw new UploadAbort(400,'Duplicate setting field.');
  seen.add(name);
  if(!/^[a-zA-Z][a-zA-Z0-9_]{0,99}$/.test(name) || name==='__proto__')throw new UploadAbort(400,'Invalid setting key.');
  const spec=allowed.find(x=>x.name===name);
  if(typeof value==='string'){
   if(spec || name.endsWith('_file_id')||name==='popup_banner_session_id'||name.endsWith('_file'))throw new UploadAbort(400,'Image IDs and paths are server managed.');
   if(value.length>30000 || Object.keys(texts).length>=90)throw new UploadAbort(413,'Setting text too large.');
   texts[name]=value;
  }else{
   if(!spec)throw new UploadAbort(400,'Unexpected image field.');
   if(value.size===0&&value.name==='')continue;
   if(value.size===0||value.size>2*1024*1024)throw new UploadAbort(413,'Image must be between 1 byte and 2 MB.');
   const bytes=new Uint8Array(await value.arrayBuffer());
   const kind=settingsImageType(value.name,value.type,bytes);
   if(!kind)throw new UploadAbort(400,'Unsupported image format or file signature.');
   files.push({field:spec,bytes,extension:kind.extension});
  }
 }
 return {texts,files};
}

async function qaStorageDirectory():Promise<string>{
 const root=settingsQaRoot(process.env.SOURCEINDIA_SETTINGS_QA_STORAGE_ROOT);
 if(!root)throw new UploadAbort(403,'Isolated QA image storage not configured.');
 let info;
 try{info=await lstat(root);}catch{throw new UploadAbort(403,'QA storage root must already exist.');}
 if(!info.isDirectory()||info.isSymbolicLink())throw new UploadAbort(403,'Invalid QA storage root.');
 const realRoot=await realpath(root);
 // Refuse redirects into symlinks, including parent symlinks.
 if(resolve(realRoot).toLowerCase()!==resolve(root).toLowerCase())throw new UploadAbort(403,'QA storage root may not use symlinks.');
 const folder=join(root,'upload','siteSettings');
 await mkdir(folder,{recursive:true,mode:0o700});
 const realFolder=await realpath(folder);
 if(resolve(realFolder).toLowerCase()!==resolve(folder).toLowerCase())throw new UploadAbort(403,'QA storage subfolder may not use symlinks.');
 return folder;
}

/** Upsert setting values using existing legacy table structure, without schema changes. */
async function upsert(c:PoolConnection,table:SettingsTable,key:string,value:string):Promise<void>{
 const pk=table==='site_settings'?'site_setting_id':'home_setting_id';
 const [rows]=await c.execute<RowDataPacket[]>(`SELECT ${pk} AS id FROM ${table} WHERE meta_key=? LIMIT 1 FOR UPDATE`,[key]);
 if(rows.length){await c.execute(`UPDATE ${table} SET meta_value=?,updated_at=NOW() WHERE ${pk}=?`,[value,rows[0].id]);return;}
 if(table==='site_settings')await c.execute('INSERT INTO site_settings (uuid,meta_key,meta_value,created_at,updated_at) VALUES (?,?,?,NOW(),NOW())',[randomUUID(),key,value]);
 else await c.execute('INSERT INTO home_settings (uuid,page,section,meta_key,meta_value,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',[randomUUID(),'home',key.startsWith('popup_banner_')?'popup_section':'home',key,value]);
}

async function replaceImage(c:PoolConnection,table:SettingsTable,item:FileToSave,dbPath:string,stale:string[]){
 const [setting]=await c.execute<RowDataPacket[]>(`SELECT meta_value FROM ${table} WHERE meta_key=? LIMIT 1 FOR UPDATE`,[item.field.idKey]);
 const priorId=Number(setting[0]?.meta_value??0);
 let imageId=0;
 if(Number.isSafeInteger(priorId)&&priorId>0){
  const [img]=await c.execute<RowDataPacket[]>('SELECT upload_image_id,file FROM upload_images WHERE upload_image_id=? LIMIT 1 FOR UPDATE',[priorId]);
  if(img[0]){
   // An upload_images row can be shared. Never change a shared image in place.
   const [siteUsers]=await c.execute<RowDataPacket[]>("SELECT COUNT(*) AS n FROM site_settings WHERE meta_key IN ('logo_file_id','favicon_file_id') AND meta_value=?",[String(priorId)]);
   const [homeUsers]=await c.execute<RowDataPacket[]>("SELECT COUNT(*) AS n FROM home_settings WHERE meta_key IN ('about_file_id','footer_logo_id','footer_img_1_id','footer_img_2_id','popup_banner_file_id') AND meta_value=?",[String(priorId)]);
   if(Number(siteUsers[0]?.n??0)+Number(homeUsers[0]?.n??0)===1){
    await c.execute('UPDATE upload_images SET file=?,updated_at=NOW() WHERE upload_image_id=?',[dbPath,priorId]);
    imageId=priorId;
    if(settingsOwnedDbPath(img[0].file))stale.push(String(img[0].file));
   }
  }
 }
 if(!imageId){const [created]=await c.execute<ResultSetHeader>('INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())',[randomUUID(),dbPath]);imageId=created.insertId;}
 await upsert(c,table,item.field.idKey,String(imageId));
}

async function mutate(req:NextRequest,table:SettingsTable):Promise<Response>{
 let parsed:MultipartFields;
 try{parsed=await parseMultipart(req,table);}catch(error){return error instanceof UploadAbort?json({message:error.publicMessage},error.code):json({message:'Invalid multipart upload.'},400);}
 if(!parsed.files.length && !Object.keys(parsed.texts).length)return json({message:'No settings provided.'},400);
 let storage='';
 if(parsed.files.length){try{storage=await qaStorageDirectory();}catch(error){return error instanceof UploadAbort?json({message:error.publicMessage},error.code):json({message:'QA upload storage unavailable.'},503);}}
 const pool=localAccountDatabase();if(!pool)return json({message:'Isolated QA database unavailable.'},503);
 let conn:PoolConnection|null=null,committed=false;
 const written:string[]=[],stale:string[]=[];
 try{
  conn=await pool.getConnection();await conn.beginTransaction();
  const texts=parsed.texts;
  if(table==='home_settings'){
   let rotate=parsed.files.some(f=>f.field.name==='popup_banner_file');
   if(Object.hasOwn(texts,'popup_banner_url')){
    const [prior]=await conn.execute<RowDataPacket[]>("SELECT meta_value FROM home_settings WHERE meta_key='popup_banner_url' LIMIT 1 FOR UPDATE");
    // Match legacy behavior: compare raw stored value against trimmed submitted URL.
    if(String(prior[0]?.meta_value??'')!==texts.popup_banner_url.trim())rotate=true;
   }
   if(rotate)texts.popup_banner_session_id=randomUUID();
  }
  for(const [name,value] of Object.entries(texts))await upsert(conn,table,name,value);
  for(const file of parsed.files){
   const filename=randomUUID()+file.extension;
   const absolute=join(storage,filename);
   await writeFile(absolute,file.bytes,{flag:'wx',mode:0o600});
   written.push(absolute);
   await replaceImage(conn,table,file,'upload/siteSettings/'+filename,stale);
  }
  await conn.commit();committed=true;
  // Cleanup only files generated by this handler inside this QA storage root.
  for(const old of stale){if(!storage)break;const file=old.split('/').pop()??'';if(settingsOwnedFilename(file)){try{await unlink(join(storage,file));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')console.error('BULK137 QA stale image cleanup failed');}}}
  return json({message:table==='site_settings'?'Site settings updated successfully':'Home settings updated successfully'});
 }catch(error){
  if(!committed&&conn){try{await conn.rollback();}catch{}}
  if(!committed)for(const f of written){try{await unlink(f);}catch{}}
  console.error('BULK137 isolated QA upload failed:',error instanceof Error?error.message:'unknown error');
  return json({message:'Isolated QA settings update failed.'},503);
 }finally{conn?.release();}
}

/** Call only after BULK136 writeGate has denied production/regular DB/unauthorized writes. */
export async function updateSettingsMultipart(req:NextRequest,table:SettingsTable):Promise<Response>{return mutate(req,table);}

/** Serve only random-name, safe content-type QA files; never read arbitrary disks. */
export async function serveSettingsQaImage(filename:string):Promise<Response>{
 if(process.env.NODE_ENV==='production'||process.env.SOURCEINDIA_SETTINGS_QA_WRITES_ENABLED!=='1'||!settingsOwnedFilename(filename))return new Response(null,{status:404});
 const mime=settingsImageMime(filename);
 if(!mime)return new Response(null,{status:404});
 let dir:string;
 try{dir=await qaStorageDirectory();}catch{return new Response(null,{status:404});}
 const target=join(dir,filename);
 try{
  const info=await lstat(target);
  if(!info.isFile()||info.isSymbolicLink()||info.size>2*1024*1024)return new Response(null,{status:404});
  const real=await realpath(target);
  if(relative(dir,real).startsWith('..')||isAbsolute(relative(dir,real)))return new Response(null,{status:404});
  const bytes=new Uint8Array(await readFile(target));
  if(!settingsImageType(filename,mime,bytes))return new Response(null,{status:404});
  return new Response(bytes,{status:200,headers:{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; sandbox",'Cross-Origin-Resource-Policy':'same-origin'}});
 }catch{return new Response(null,{status:404});}
}
