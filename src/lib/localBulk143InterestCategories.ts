/** BULK143: Original interest_categories 8 routes; authorized writes reserved for isolated QA.
 * Original React/Express application and live database are never modified by patch application.
 */
import type {NextRequest} from 'next/server';
import type {RowDataPacket,PoolConnection,ResultSetHeader} from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {join,resolve,isAbsolute,basename} from 'node:path';
import {localAccountDatabase} from '@/lib/localAccountDatabase';

const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const unavailable=()=>respond({error:'Database unavailable'},503);
const notFound=()=>respond({message:'Interest Category not found'},404);
const db=()=>localAccountDatabase();
const validId=(s:string)=>/^[1-9]\d{0,14}$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
const dateSql=(col:'created_at'|'updated_at')=>`CASE WHEN c.${col} IS NULL THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(DATE_ADD(c.${col}, INTERVAL TIMESTAMPDIFF(SECOND,NOW(),UTC_TIMESTAMP()) SECOND),'%Y-%m-%dT%H:%i:%s.%f'),23),'Z') END AS ${col}`;
const fields=`c.interest_category_id AS id,c.uuid,c.name,c.color,c.file_id,c.status,${dateSql('created_at')},${dateSql('updated_at')}`;
const joinRead='FROM interest_categories c';
const joins=`FROM interest_categories c LEFT JOIN colors color ON color.color_id=CAST(c.color AS UNSIGNED) LEFT JOIN upload_images image ON image.upload_image_id=c.file_id`;
const withFile=`${fields},image.file AS image_file`;
type InterestRow=RowDataPacket & {id:number;uuid:string;name:string;color:string;file_id:number;status:number;image_file?:string|null};
function stripImage(r:InterestRow){const {image_file,...base}=r;return base;}
const MAX_FILE=2*1024*1024,MAX_FORM=3*1024*1024;
const owned=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|jpeg|gif|webp)$/i;
const mime:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'};
const pathPrefix='upload/interest_category/';
function imageOwned(dbPath:unknown){if(typeof dbPath!=='string'||!dbPath.startsWith(pathPrefix))return null;const file=dbPath.slice(pathPrefix.length);return basename(file)===file&&owned.test(file)?file:null;}
function root(){const value=process.env.SOURCEINDIA_INTEREST_CATEGORIES_QA_STORAGE_ROOT;if(!value||!isAbsolute(value))return null;const abs=resolve(value);if(!/(^|[\\/])(qa|test|sandbox)([\\/]|$)/i.test(abs))return null;if([resolve('.'),resolve('upload'),resolve('public')].includes(abs))return null;return abs;}
function validImage(filename:string,mimetype:string,bytes:Uint8Array){const ext=filename.toLowerCase().split('.').pop()??'';if(!Object.hasOwn(mime,ext)||mimetype.toLowerCase()!==mime[ext]||bytes.length<12||bytes.length>MAX_FILE)return null;
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const gif=['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.subarray(0,6)));
 const webp=String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP';
 return (ext==='png'?png:ext==='jpg'||ext==='jpeg'?jpg:ext==='gif'?gif:webp)?ext:null;
}
export function interestCategoriesQaGate(req:NextRequest,env:NodeJS.ProcessEnv=process.env){
 if(env.NODE_ENV==='production'||env.SOURCEINDIA_INTEREST_CATEGORIES_QA_WRITES_ENABLED!=='1')return respond({message:'Interest category writes disabled.'},403);
 const dbName=env.DB_NAME??'',dbHost=(env.DB_HOST??'').toLowerCase();
 if(!dbName||dbName!==env.SOURCEINDIA_INTEREST_CATEGORIES_QA_DB_NAME||!/(qa|test|sandbox)/i.test(dbName)||!['localhost','127.0.0.1','::1'].includes(dbHost))return respond({message:'Isolated QA database required.'},403);
 if(!root())return respond({message:'Isolated QA storage required.'},403);
 const key=env.SOURCEINDIA_INTEREST_CATEGORIES_QA_TOKEN??'',auth=req.headers.get('authorization')??'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(key.length<32||Buffer.byteLength(key)!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(key),Buffer.from(token)))return respond({message:'QA authorization required.'},401);
 const origin=req.headers.get('origin');if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return respond({message:'Origin denied.'},403);}catch{return respond({message:'Origin denied.'},403);}}
 return null;
}
async function parseForm(req:NextRequest,requireFile:boolean){const contentLength=Number(req.headers.get('content-length')??0);if(!Number.isSafeInteger(contentLength)||contentLength>MAX_FORM)return {error:respond({message:'Multipart request too large'},413)} as const;
 if(!(req.headers.get('content-type')??'').toLowerCase().startsWith('multipart/form-data'))return {error:respond({message:'Expected multipart form'},415)} as const;
 let form:FormData;try{form=await req.formData();}catch{return {error:respond({message:'Invalid multipart form'},400)} as const;}
 try{
  for(const k of form.keys())if(!['name','color','status','file'].includes(k))throw Error('Unexpected field');
  for(const k of ['name','color','status','file'])if(form.getAll(k).length>1)throw Error('Duplicate field');
  const text=(key:string)=>{const value=form.get(key);if(value!==null&&typeof value!=='string')throw Error('Invalid text field');return value;};
  const name=text('name'),color=text('color'),status=text('status');
  if(!name||name.length>255||!color||color.length>255||!['0','1'].includes(status??''))throw Error('Invalid category data');
  const candidate=form.get('file');if(candidate!==null&&!(candidate instanceof File))throw Error('Invalid image');
  const file=candidate instanceof File?candidate:null;if(requireFile&&!file)throw Error('Image required');
  if(file&&file.size>MAX_FILE)return {error:respond({message:'Image exceeds 2MB'},413)} as const;
  const bytes=file?new Uint8Array(await file.arrayBuffer()):null,ext=file&&bytes?validImage(file.name,file.type,bytes):null;
  if(file&&!ext)throw Error('Invalid image signature');
  return {data:{name,color,status:Number(status),bytes,ext}} as const;
 }catch(e){return {error:respond({message:e instanceof Error?e.message:'Invalid input'},400)} as const;}
}
async function trans<T>(fn:(c:PoolConnection)=>Promise<T>){const pool=db();if(!pool)throw Error('NO_DB');const c=await pool.getConnection();try{await c.beginTransaction();const result=await fn(c);await c.commit();return result;}catch(e){await c.rollback().catch(()=>{});throw e;}finally{c.release();}}
async function byId(id:number,conn?:PoolConnection){const handle=conn??db();if(!handle)throw Error('NO_DB');const [rows]=await handle.execute<InterestRow[]>(`SELECT ${fields} ${joinRead} WHERE c.interest_category_id=? LIMIT 1`,[id]);return rows[0]??null;}
async function persistImage(bytes:Uint8Array,ext:string){const base=root();if(!base)throw Error('NO_QA_STORAGE');const folder=join(base,'interest_category');await mkdir(folder,{recursive:true});const filename=`${randomUUID()}.${ext}`;const abs=join(folder,filename);await writeFile(abs,bytes,{flag:'wx',mode:0o600});return {abs,dbPath:pathPrefix+filename};}
const cleanFile=async(file:string|null)=>{if(file)await unlink(file).catch(()=>{});};
function diskFile(dbPath:unknown){const base=root(),filename=imageOwned(dbPath);return base&&filename?join(base,'interest_category',filename):null;}

export async function listInterestCategories(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<InterestRow[]>(`SELECT ${fields} ${joinRead} ORDER BY c.interest_category_id ASC`);return respond(rows);}catch{return unavailable();}}
export async function interestCategoriesCount(){const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM interest_categories');return respond({total:rows[0]?.total??0});}catch{return unavailable();}}
export async function getInterestCategory(raw:string){const id=validId(raw);if(id===null)return notFound();const pool=db();if(!pool)return unavailable();try{const [rows]=await pool.execute<InterestRow[]>(`SELECT ${withFile} ${joins} WHERE c.interest_category_id=? LIMIT 1`,[id]);if(!rows.length)return notFound();const r=rows[0];return respond({...stripImage(r),UploadImage:r.image_file?{file:r.image_file}:null,file_name:r.image_file??null});}catch{return unavailable();}}
export async function interestCategoriesServerSide(req:NextRequest){const pool=db();if(!pool)return unavailable();const q=req.nextUrl.searchParams;
 const page=Number(q.get('page')??1),limit=Number(q.get('limit')??10),search=q.get('search')??'';
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(limit)||limit<1||limit>500||search.length>255)return respond({message:'Invalid pagination'},400);
 const sortBy=q.get('sortBy')??'id',allowed:Record<string,string>={id:'c.interest_category_id',name:'c.name',created_at:'c.created_at',updated_at:'c.updated_at',color_name:'color.title'};
 const direction=['ASC','DESC'].includes(q.get('sort')??'DESC')?(q.get('sort')??'DESC'):'ASC',order=allowed[sortBy]??'c.interest_category_id';
 const where=search?'WHERE c.name LIKE ? OR color.title LIKE ?':'',params=search?['%'+search+'%','%'+search+'%']:[];
 try{const [[total],[filtered],[rows]]=await Promise.all([
 pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM interest_categories'),
 pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${joins} ${where}`,params),
 pool.execute<InterestRow[]>(`SELECT c.interest_category_id AS id,c.name,c.color,color.title AS color_name,c.file_id,image.file AS file_name,c.status,${dateSql('created_at')},${dateSql('updated_at')} ${joins} ${where} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit])]);
 return respond({data:rows,totalRecords:total[0]?.total??0,filteredRecords:filtered[0]?.total??0});
 }catch{return unavailable();}
}
export async function createInterestCategory(req:NextRequest){const denied=interestCategoriesQaGate(req);if(denied)return denied;const parsed=await parseForm(req,true);if('error' in parsed)return parsed.error;const data=parsed.data;if(!data.bytes||!data.ext)return respond({message:'Image required'},400);
 let saved:Awaited<ReturnType<typeof persistImage>>|null=null;
 try{saved=await persistImage(data.bytes,data.ext);const result=await trans(async c=>{const [img]=await c.execute<ResultSetHeader>('INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())',[randomUUID(),saved!.dbPath]);const [cat]=await c.execute<ResultSetHeader>('INSERT INTO interest_categories (uuid,name,color,file_id,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',[randomUUID(),data.name,data.color,img.insertId,data.status]);return byId(cat.insertId,c);});return respond({message:'Interest Category created',interestCategory:result},201);}catch{await cleanFile(saved?.abs??null);return unavailable();}
}
export async function updateInterestCategory(req:NextRequest,raw:string){const denied=interestCategoriesQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();const parsed=await parseForm(req,false);if('error' in parsed)return parsed.error;const data=parsed.data;
 let saved:Awaited<ReturnType<typeof persistImage>>|null=null,obsolete:string|null=null;
 try{const response=await trans(async c=>{const [rows]=await c.execute<RowDataPacket[]>('SELECT c.file_id,i.file FROM interest_categories c LEFT JOIN upload_images i ON i.upload_image_id=c.file_id WHERE c.interest_category_id=? FOR UPDATE',[id]);if(!rows.length)return notFound();
 // Protect pre-existing category data from write tests: only QA-owned uploaded images are writable.
 if(!imageOwned(rows[0].file))return respond({message:'Category is not QA-owned; refusing update'},403);
 let fileId=Number(rows[0].file_id);
 if(data.bytes&&data.ext){saved=await persistImage(data.bytes,data.ext);obsolete=diskFile(rows[0].file);await c.execute('UPDATE upload_images SET file=?,updated_at=NOW() WHERE upload_image_id=?',[saved.dbPath,fileId]);}
 await c.execute('UPDATE interest_categories SET name=?,color=?,status=?,updated_at=NOW() WHERE interest_category_id=?',[data.name,data.color,data.status,id]);return respond({message:'Interest Category updated',interestCategory:await byId(id,c)});
 });if(saved&&obsolete)await cleanFile(obsolete);return response;}catch{await cleanFile((saved as {abs:string}|null)?.abs??null);return unavailable();}
}
export async function deleteInterestCategory(req:NextRequest,raw:string){const denied=interestCategoriesQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();let obsolete:string|null=null;
 try{const response=await trans(async c=>{const [rows]=await c.execute<RowDataPacket[]>('SELECT c.file_id,i.file FROM interest_categories c LEFT JOIN upload_images i ON i.upload_image_id=c.file_id WHERE c.interest_category_id=? FOR UPDATE',[id]);if(!rows.length)return notFound();obsolete=diskFile(rows[0].file);if(!obsolete)return respond({message:'Category is not QA-owned; refusing delete'},403);
 const [used]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM interest_categories WHERE file_id=?',[rows[0].file_id]);if(Number(used[0]?.total)!==1)return respond({message:'Shared image cannot be deleted'},409);
 await c.execute('DELETE FROM interest_categories WHERE interest_category_id=?',[id]);await c.execute('DELETE FROM upload_images WHERE upload_image_id=?',[rows[0].file_id]);return respond({message:'Interest Category deleted successfully'});
 });if(response.status===200)await cleanFile(obsolete);return response;}catch{return unavailable();}
}
export async function updateInterestCategoryStatus(req:NextRequest,raw:string){const denied=interestCategoriesQaGate(req);if(denied)return denied;const id=validId(raw);if(id===null)return notFound();let payload:unknown;try{payload=await req.json();}catch{return respond({message:'Invalid JSON'},400);}const value=payload&&typeof payload==='object'&&!Array.isArray(payload)?(payload as Record<string,unknown>).status:undefined;if(value!==0&&value!==1)return respond({message:'Invalid status. Use 1 (Active) or 0 (Deactive).'},400);
 try{return await trans(async c=>{const [rows]=await c.execute<RowDataPacket[]>('SELECT c.interest_category_id,i.file FROM interest_categories c LEFT JOIN upload_images i ON i.upload_image_id=c.file_id WHERE c.interest_category_id=? FOR UPDATE',[id]);if(!rows.length)return notFound();if(!imageOwned(rows[0].file))return respond({message:'Category is not QA-owned; refusing update'},403);
 await c.execute('UPDATE interest_categories SET status=?,updated_at=NOW() WHERE interest_category_id=?',[value,id]);return respond({message:'Status updated',interestCategory:await byId(id,c)});
 });}catch{return unavailable();}
}
