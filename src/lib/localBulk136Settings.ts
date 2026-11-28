/** BULK136: Native Settings reads and isolated-QA-only text updates.
 * Compare with legacy/sourceindia-express/controllers/settingController.js.
 * Original /site exposes SMTP secrets without auth: intentionally require a private bearer token.
 * Multipart upload / filesystem side effects are explicitly not enabled in this batch.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket, PoolConnection, ResultSetHeader} from 'mysql2/promise';
import {timingSafeEqual,randomUUID} from 'node:crypto';
import {localAccountDatabase} from '@/lib/localAccountDatabase';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>reply({error:'Local database unavailable'},503);
const excluded=new Set(['smtp_password','smtp_username','smtp_server_address','smtp_port','smtp_from_address','smtp_auto_reply','sms_password','sms_pid','site_email','sms_dlt_template_id','sms_route','sms_url','sms_username','smtp_from_name','smtp_tls']);
const homeImages={about_file_id:'about_file',footer_logo_id:'footer_logo',footer_img_1_id:'footer_img_1',footer_img_2_id:'footer_img_2',popup_banner_file_id:'popup_banner_file'} as const;
const visibleHome=['footer_logo','footer_heading','footershort_description','footer_img_1','footer_img_2','contactphone_1','contactphone_2','contactemail','contact_map_url','contactaddress','facebook_url','twitter_url','linkedin_url','youtube_url','instagram_url','popup_banner_file','popup_banner_url','popup_banner_status','popup_banner_session_id'];
const db=()=>localAccountDatabase();
async function settingRows(table:'site_settings'|'home_settings'){
 const pool=db();if(!pool)throw Error('DB_UNAVAILABLE');
 const [rows]=await pool.query<RowDataPacket[]>(`SELECT meta_key,meta_value FROM ${table}`);return rows;
}
async function imageFile(id:unknown){
 if(typeof id!=='string'&&typeof id!=='number')return null;
 const n=Number(id);if(!Number.isSafeInteger(n)||n<=0)return null;
 const pool=db();if(!pool)throw Error('DB_UNAVAILABLE');
 const [r]=await pool.execute<RowDataPacket[]>('SELECT file FROM upload_images WHERE upload_image_id=? LIMIT 1',[n]);return r[0]?.file??null;
}
async function formatted(table:'site_settings'|'home_settings'){
 const rows=await settingRows(table),output:Record<string,unknown>={};
 for(const r of rows)output[String(r.meta_key)]=r.meta_value;
 if(table==='site_settings'){
  for(const [id,out] of [['logo_file_id','logo_file'],['favicon_file_id','favicon_file']]){const file=await imageFile(output[id]);if(file!==null)output[out]=file;}
 }else for(const [id,out] of Object.entries(homeImages)){const file=await imageFile(output[id]);if(file!==null)output[out]=file;}
 return output;
}
async function menus(){
 const pool=db();if(!pool)throw Error('DB_UNAVAILABLE');
 const [rows]=await pool.query<RowDataPacket[]>('SELECT front_menu_id AS id,name,type,position,parent_id,link,is_show,status FROM front_menu ORDER BY type ASC, position ASC');
 const map=new Map<number,Record<string,unknown>>(),flat:Record<string,unknown>[]=[];
 for(const r of rows){const item:Record<string,unknown>={...r,sub_menu:[]};map.set(Number(r.id),item);flat.push(item);}
 const parents:Record<string,unknown>[]=[];
 for(const item of flat){const parent=Number(item.parent_id);if(parent===0)parents.push(item);else{const p=map.get(parent);if(p)(p.sub_menu as unknown[]).push(item);}}
 return parents;
}
function readGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env){
 // Server's original GET /site exposes SMTP credentials. Never expose them anonymously.
 const secret=env.SOURCEINDIA_SETTINGS_PRIVATE_READ_TOKEN??'';
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /,'')??'';
 return secret.length>=32&&Buffer.byteLength(secret)===Buffer.byteLength(bearer)&&timingSafeEqual(Buffer.from(secret),Buffer.from(bearer));
}
export async function getSite(req:NextRequest){if(!readGate(req))return reply({message:'Private settings require authorization.'},401);try{return reply(await formatted('site_settings'));}catch{return unavailable();}}
export async function getFrontSite(){try{
 const site=await formatted('site_settings');for(const k of excluded)delete site[k];
 site.front_menu=await menus();const home=await formatted('home_settings');
 site.home_settings=Object.fromEntries(visibleHome.filter(k=>home[k]!==undefined).map(k=>[k,home[k]]));
 return reply(site);
}catch{return unavailable();}}
export async function getHome(){try{return reply(await formatted('home_settings'));}catch{return unavailable();}}
export function writeGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env):Response|null{
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_SETTINGS_QA_WRITES_ENABLED!=='1')return reply({message:'Settings writes disabled.'},403);
 const name=env.DB_NAME??'',host=(env.DB_HOST??'').toLowerCase();
 if(!/(qa|test|sandbox)/i.test(name)||name!==env.SOURCEINDIA_SETTINGS_QA_DB_NAME||!['localhost','127.0.0.1','::1'].includes(host))return reply({message:'Isolated QA database required.'},403);
 if(!readGate(req, {...env,SOURCEINDIA_SETTINGS_PRIVATE_READ_TOKEN:env.SOURCEINDIA_SETTINGS_QA_TOKEN}))return reply({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return reply({message:'Origin denied.'},403);}catch{return reply({message:'Origin denied.'},403);}}
 return null;
}
async function parse(req:NextRequest):Promise<Record<string,string>|null>{
 const ct=req.headers.get('content-type')??'';const size=Number(req.headers.get('content-length')??0);
 if(!Number.isFinite(size)||size>200_000)return null;
 try{
  if(ct.startsWith('application/json')){const v:unknown=await req.json();if(!v||typeof v!=='object'||Array.isArray(v))return null;const out:Record<string,string>={};for(const [k,x] of Object.entries(v)){if(typeof x!=='string'||k.length>255||k==='__proto__')return null;out[k]=x;}return out;}
  if(ct.startsWith('application/x-www-form-urlencoded')){const raw=await req.text();if(raw.length>200_000)return null;const out:Record<string,string>={};for(const [k,v] of new URLSearchParams(raw)){if(Object.hasOwn(out,k)||k.length>255||k==='__proto__')return null;out[k]=v;}return out;}
 }catch{/* malformed */}return null;
}
async function transaction<T>(f:(conn:PoolConnection)=>Promise<T>){const pool=db();if(!pool)throw Error('DB_UNAVAILABLE');const conn=await pool.getConnection();try{await conn.beginTransaction();const r=await f(conn);await conn.commit();return r;}catch(e){await conn.rollback();throw e;}finally{conn.release();}}
async function upsert(conn:PoolConnection,table:'site_settings'|'home_settings',key:string,value:string){
 const pk=table==='site_settings'?'site_setting_id':'home_setting_id';
 const [r]=await conn.execute<RowDataPacket[]>(`SELECT ${pk} AS id FROM ${table} WHERE meta_key=? LIMIT 1 FOR UPDATE`,[key]);
 if(r.length){await conn.execute(`UPDATE ${table} SET meta_value=?,updated_at=NOW() WHERE ${pk}=?`,[value,r[0].id]);return;}
 if(table==='site_settings')await conn.execute<ResultSetHeader>('INSERT INTO site_settings (uuid,meta_key,meta_value,created_at,updated_at) VALUES (?,?,?,NOW(),NOW())',[randomUUID(),key,value]);
 else await conn.execute<ResultSetHeader>('INSERT INTO home_settings (uuid,page,section,meta_key,meta_value,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',[randomUUID(),'home',key.startsWith('popup_banner_')?'popup_section':'home',key,value]);
}
export async function updateSettings(req:NextRequest,table:'site_settings'|'home_settings'){
 const denied=writeGate(req);if(denied)return denied;
 if((req.headers.get('content-type')??'').startsWith('multipart/form-data'))return reply({message:'Multipart setting image updates require verified QA storage.'},501);
 const values=await parse(req);if(!values)return reply({message:'Invalid settings payload.'},400);
 // Only text fields; original file paths must be controlled by upload handler, not client strings.
 const fileKeys=table==='site_settings'?['logo_file','favicon_file']:Object.values(homeImages);
 if(Object.keys(values).some(k=>fileKeys.includes(k)))return reply({message:'File uploads require multipart handling.'},400);
 if(table==='home_settings'&&Object.hasOwn(values,'popup_banner_url')){
  const existing=await formatted('home_settings').catch(()=>null);
  if(!existing)return unavailable();
  if(String(existing.popup_banner_url??'')!==values.popup_banner_url.trim())values.popup_banner_session_id=randomUUID();
 }
 try{await transaction(async conn=>{for(const [k,v] of Object.entries(values))await upsert(conn,table,k,v);});return reply({message:table==='site_settings'?'Site settings updated successfully':'Home settings updated successfully'});}catch{return unavailable();}
}
