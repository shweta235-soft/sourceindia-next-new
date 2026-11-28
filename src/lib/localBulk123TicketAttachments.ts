/** BULK123: private, QA-only ticket attachments (never public or production storage).
 * Files are write-once with cryptographically unpredictable names; only these
 * names can be deleted by this module. Legacy file cleanup needs separate QA.
 */
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';

export const TICKET_ATTACHMENT_MAX_BYTES=5*1024*1024;
const validExt=new Set(['pdf','jpg','jpeg','png','csv','txt','xls','xlsx']);
const newName=/^b123_[a-f0-9]{32}\.(?:pdf|jpg|jpeg|png|csv|txt|xls|xlsx)$/;
export type TicketAttachment={filename:string;buffer:Buffer;mediaType:'image'|'file'};
export const managedTicketFileName=(name:unknown):name is string=>typeof name==='string'&&newName.test(name);
export function ticketAttachmentRoot(){return resolve(process.cwd(),'.qa-private-ticket-files');}

export async function parseTicketAttachment(value:File):Promise<TicketAttachment>{
 if(!value||typeof value.name!=='string'||typeof value.arrayBuffer!=='function')throw Error('INVALID_TICKET_ATTACHMENT');
 if(value.size<1||value.size>TICKET_ATTACHMENT_MAX_BYTES)throw Error('TICKET_ATTACHMENT_SIZE');
 const original=value.name.toLowerCase();
 if(original.includes('/')||original.includes('\\')||original.includes('\0'))throw Error('INVALID_TICKET_ATTACHMENT');
 const ext=original.split('.').pop()||'';
 if(!validExt.has(ext))throw Error('TICKET_ATTACHMENT_TYPE');
 const mime=(value.type||'').toLowerCase();
 const allowed:Record<string,readonly string[]>={
  pdf:['application/pdf','application/octet-stream'],
  jpg:['image/jpeg','application/octet-stream'],jpeg:['image/jpeg','application/octet-stream'],
  png:['image/png','application/octet-stream'],
  csv:['text/csv','text/plain','application/vnd.ms-excel','application/octet-stream'],
  txt:['text/plain','application/octet-stream'],
  xls:['application/vnd.ms-excel','application/octet-stream'],
  xlsx:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','application/octet-stream'],
 };
 if(mime&&!allowed[ext].includes(mime))throw Error('TICKET_ATTACHMENT_TYPE');
 const buffer=Buffer.from(await value.arrayBuffer());
 if(buffer.length!==value.size)throw Error('INVALID_TICKET_ATTACHMENT');
 const starts=(bytes:number[])=>bytes.every((b,i)=>buffer[i]===b);
 if(ext==='pdf'&&!starts([0x25,0x50,0x44,0x46]))throw Error('TICKET_ATTACHMENT_TYPE');
 if(ext==='png'&&!starts([137,80,78,71,13,10,26,10]))throw Error('TICKET_ATTACHMENT_TYPE');
 if((ext==='jpg'||ext==='jpeg')&&!starts([255,216,255]))throw Error('TICKET_ATTACHMENT_TYPE');
 if(ext==='xlsx'&&!starts([80,75]))throw Error('TICKET_ATTACHMENT_TYPE');
 if(ext==='xls'&&!starts([208,207,17,224,161,177,26,225]))throw Error('TICKET_ATTACHMENT_TYPE');
 if((ext==='txt'||ext==='csv')&&(buffer.includes(0)||new TextDecoder('utf-8',{fatal:true}).decode(buffer).includes('\u0000')))
  throw Error('TICKET_ATTACHMENT_TYPE');
 return {filename:`b123_${randomBytes(16).toString('hex')}.${ext}`,buffer,mediaType:['jpg','jpeg','png'].includes(ext)?'image':'file'};
}
async function ensureStorage(){
 const root=ticketAttachmentRoot();await mkdir(root,{recursive:true,mode:0o700});
 const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('QA_ATTACHMENT_STORAGE_INVALID');
 return root;
}
export async function persistTicketAttachment(file:TicketAttachment):Promise<string>{
 if(!managedTicketFileName(file.filename))throw Error('INVALID_TICKET_ATTACHMENT_NAME');
 const root=await ensureStorage();
 await writeFile(join(root,file.filename),file.buffer,{flag:'wx',mode:0o600});
 return file.filename;
}
export async function removeTicketAttachment(name:unknown):Promise<void>{
 if(!managedTicketFileName(name))throw Error('LEGACY_ATTACHMENT_REQUIRES_SEPARATE_QA');
 const file=join(ticketAttachmentRoot(),name);
 try{await unlink(file);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
}
export async function loadTicketAttachment(name:unknown):Promise<Buffer>{
 if(!managedTicketFileName(name))throw Error('INVALID_TICKET_ATTACHMENT_NAME');
 return readFile(join(ticketAttachmentRoot(),name));
}
export function privateTicketAttachmentUrl(id:number,name:string){
 if(!Number.isSafeInteger(id)||id<=0||!managedTicketFileName(name))throw Error('INVALID_TICKET_ATTACHMENT_NAME');
 return `/v2/api/tickets/attachments/${id}/${name}`;
}
