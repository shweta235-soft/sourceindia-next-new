/** BULK126 completion: isolated-QA application image storage.
 * Compatible database paths (upload/applications/<filename>), but only ever
 * stored beneath an explicit QA-only root. No access to original React files.
 */
import {randomBytes} from 'node:crypto';
import {lstat,mkdir,readFile,rename,unlink,writeFile} from 'node:fs/promises';
import {isAbsolute,join,resolve,sep} from 'node:path';

const prefix='upload/applications/';
const maxBytes=6*1024*1024;
const types:Record<string,readonly string[]>={
 jpg:['image/jpeg','image/jpg','application/octet-stream'],
 jpeg:['image/jpeg','image/jpg','application/octet-stream'],
 png:['image/png','application/octet-stream'],
 gif:['image/gif','application/octet-stream'],
 webp:['image/webp','application/octet-stream'],
};
export type ApplicationUpload={dbPath:string;bytes:Buffer};
export type QuarantinedFile={original:string;quarantine:string};

export function applicationQaRoot(env:NodeJS.ProcessEnv=process.env):string{
 const supplied=env.SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT??'';
 if(!supplied||!isAbsolute(supplied)||!/(?:qa|test|sandbox)/i.test(supplied))throw Error('APPLICATION_QA_STORAGE_REQUIRED');
 const root=resolve(/* turbopackIgnore: true */ supplied);
 if(root===resolve(/* turbopackIgnore: true */ process.cwd())||root===resolve(/* turbopackIgnore: true */ process.cwd(),'upload')||root===resolve(sep))throw Error('APPLICATION_QA_STORAGE_UNSAFE');
 return root;
}
export async function applicationImage(value:File):Promise<ApplicationUpload>{
 if(!value||typeof value.name!=='string'||typeof value.arrayBuffer!=='function'||value.size<1||value.size>maxBytes)throw Error('INVALID_APPLICATION_IMAGE');
 if(value.name.includes('/')||value.name.includes('\\')||value.name.includes('\0'))throw Error('INVALID_APPLICATION_IMAGE');
 const ext=value.name.toLowerCase().match(/\.([a-z]{3,4})$/)?.[1]??'';
 if(!Object.hasOwn(types,ext)||!types[ext].includes((value.type||'application/octet-stream').toLowerCase()))throw Error('INVALID_APPLICATION_IMAGE');
 const bytes=Buffer.from(await value.arrayBuffer());if(bytes.length!==value.size)throw Error('INVALID_APPLICATION_IMAGE');
 const match=(signature:readonly number[],offset=0)=>signature.every((b,i)=>bytes[offset+i]===b);
 const valid=ext==='png'?match([137,80,78,71,13,10,26,10]):
  ['jpg','jpeg'].includes(ext)?match([255,216,255]):
  ext==='gif'?(match([71,73,70,56,55,97])||match([71,73,70,56,57,97])):
  ext==='webp'?(match([82,73,70,70])&&match([87,69,66,80],8)):false;
 if(!valid)throw Error('INVALID_APPLICATION_IMAGE');
 return {dbPath:`${prefix}b126_${randomBytes(16).toString('hex')}.${ext}`,bytes};
}
function relativeFilePath(dbPath:string):string{
 if(!dbPath.startsWith(prefix))throw Error('NON_QA_APPLICATION_FILE');
 const name=dbPath.slice(prefix.length);
 // The original Multer destination is flat. Never allow paths or dot entries.
 if(name==='.'||name==='..'||!name||name.length>180||!/^[-a-zA-Z0-9_. ]+$/.test(name)||name.startsWith('.'))throw Error('NON_QA_APPLICATION_FILE');
 if(!/\.(?:jpg|jpeg|png|gif|webp)$/i.test(name))throw Error('NON_QA_APPLICATION_FILE');
 return name;
}
export function applicationFilePath(dbPath:string,env:NodeJS.ProcessEnv=process.env):string{
 const root=applicationQaRoot(env),name=relativeFilePath(dbPath);
 return join(root,'upload','applications',name);
}
async function directory(env:NodeJS.ProcessEnv=process.env){
 const root=applicationQaRoot(env),upload=join(root,'upload'),dir=join(upload,'applications');
 for(const part of [root,upload,dir]){
  await mkdir(part,{recursive:true,mode:0o700});
  const stat=await lstat(part);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('APPLICATION_QA_SYMLINK');
 }
 return dir;
}
async function safeFile(path:string):Promise<boolean>{
 try{const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())throw Error('APPLICATION_QA_FILE_UNSAFE');return true;}
 catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;}
}
export async function writeApplicationImage(file:ApplicationUpload):Promise<void>{
 await directory();const path=applicationFilePath(file.dbPath);
 await writeFile(path,file.bytes,{flag:'wx',mode:0o600});
}
export async function discardApplicationImage(dbPath:string):Promise<void>{
 const path=applicationFilePath(dbPath);
 if(await safeFile(path))await unlink(path);
}
/** Move the previous file out of the published path before SQL commit.
 * If SQL fails, restore it; after commit, discard it. */
export async function quarantineApplicationImage(dbPath:string):Promise<QuarantinedFile|null>{
 if(!dbPath)return null;
 await directory();const original=applicationFilePath(dbPath);
 if(!await safeFile(original))return null;
 const quarantine=join(await directory(),`.b126-trash-${randomBytes(16).toString('hex')}`);
 await rename(original,quarantine);
 return {original,quarantine};
}
export async function restoreApplicationImage(file:QuarantinedFile):Promise<void>{
 if(await safeFile(file.quarantine))await rename(file.quarantine,file.original);
}
export async function disposeApplicationImage(file:QuarantinedFile):Promise<void>{
 if(await safeFile(file.quarantine))await unlink(file.quarantine);
}
export async function readApplicationImageForQa(dbPath:string):Promise<Buffer>{
 const path=applicationFilePath(dbPath);if(!await safeFile(path))throw Error('APPLICATION_QA_FILE_NOT_FOUND');return readFile(path);
}
