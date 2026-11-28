import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,rmSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const folder=mkdtempSync(join(tmpdir(),'b123-ticket-qa-test-'));
const path='src/lib/localBulk123TicketAttachments.ts';
const source=readFileSync(path,'utf8');
const compiled=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
assert.equal(compiled.diagnostics.length,0);
const context={module:{exports:{}},exports:{},require,process:{cwd:()=>folder},Buffer,TextDecoder,Set,Error,console};
context.exports=context.module.exports;
runInNewContext(compiled.outputText,context,{filename:'BULK123-attachment.js'});
const api=context.module.exports;
const file=(content,name,type)=>new File([content],name,{type});

test('BULK123 original ticket upload routes and protected download aliases exist',()=>{
 for(const [method,endpoint] of [
  ['POST','src/app/v2/api/tickets/route.ts'],['POST','src/app/v2/api/tickets/store-ticket/route.ts'],
  ['POST','src/app/v2/api/tickets/store-support-ticket-reply/route.ts'],['PUT','src/app/v2/api/tickets/[id]/route.ts'],
  ['PATCH','src/app/v2/api/tickets/[id]/status/route.ts'],['DELETE','src/app/v2/api/tickets/[id]/route.ts']]){
  assert.ok(existsSync(endpoint),endpoint);assert.match(readFileSync(endpoint,'utf8'),new RegExp(`export async function ${method}\\(`));
 }
 for(const endpoint of [
  'src/app/v2/api/tickets/attachments/[id]/[filename]/route.ts',
  'src/app/admin/api/local/tickets/attachments/[id]/[filename]/route.ts']){
  assert.match(readFileSync(endpoint,'utf8'),/privateTicketDownload/);
 }
 const downloader=readFileSync('src/lib/localBulk123TicketDownload.ts','utf8');
 assert.match(downloader,/ticketAdminScope/);assert.match(downloader,/Bearer /);
 assert.match(downloader,/attachment=\?/);assert.match(downloader,/private, no-store/);
});
test('safe MIME, magic signature and file extension validation',async()=>{
 const good=await api.parseTicketAttachment(file('%PDF-1.7\nhello','test.pdf','application/pdf'));
 assert.match(good.filename,/^b123_[a-f0-9]{32}\.pdf$/);assert.equal(good.mediaType,'file');
 const text=await api.parseTicketAttachment(file('hello','test.txt','text/plain'));
 assert.equal(text.mediaType,'file');
 const png=await api.parseTicketAttachment(file(new Uint8Array([137,80,78,71,13,10,26,10,0]),'pic.png','image/png'));
 assert.equal(png.mediaType,'image');
 for(const invalid of [file('MZ','bad.exe','application/octet-stream'),
  file('<svg/>','pic.svg','image/svg+xml'),file('malicious','fake.pdf','application/pdf'),
  file('data','wrong.png','image/jpeg'),file('test','../traversal.txt','text/plain'),
  file(new Uint8Array(5*1024*1024+1),'huge.txt','text/plain')]){
  await assert.rejects(api.parseTicketAttachment(invalid));
 }
});
test('private storage cannot delete legacy or traversal names and cleanup works',async()=>{
 const attachment=await api.parseTicketAttachment(file('private ticket data','safe.txt','text/plain'));
 await api.persistTicketAttachment(attachment);
 assert.deepEqual(await api.loadTicketAttachment(attachment.filename),Buffer.from('private ticket data'));
 assert.equal(api.managedTicketFileName('../escape.txt'),false);
 await assert.rejects(api.removeTicketAttachment('../escape.txt'));
 await assert.rejects(api.removeTicketAttachment('legacy.pdf'));
 await api.removeTicketAttachment(attachment.filename);
 await assert.rejects(api.loadTicketAttachment(attachment.filename));
});
test('notification event maps match exact original Express user/admin template IDs',()=>{
 const source=readFileSync('src/lib/localBulk122TicketNative.ts','utf8');
 const expected={store:[110,111],adminReply:[114,115],guestReply:[113,112],resolved:[117,116],cancelled:[118,119]};
 for(const [name,ids] of Object.entries(expected))assert.match(source,new RegExp(`${name}:\\{user:${ids[0]},admin:${ids[1]}\\}`));
 assert.match(source,/SOURCEINDIA_TICKET_QA_NOTIFICATIONS_ENABLED/);
 assert.match(source,/cfg\?\.recipients\.includes/);
 assert.match(source,/ticketQaGate\(\)/);
 assert.match(source,/sendTicketPair\('store'/);
 assert.match(source,/sendTicketPair\(result\.addedBy/);
});
test('attachment root is ignored from Git and no legacy source was modified',()=>{
 assert.match(readFileSync('.gitignore','utf8'),/\.qa-private-ticket-files\//);
 assert.match(readFileSync('legacy/sourceindia-express/controllers/ticketController.js','utf8'),/getMulterUpload\('tickets'\)/);
});
process.on('exit',()=>rmSync(folder,{recursive:true,force:true}));
