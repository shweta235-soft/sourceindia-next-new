import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const file='src/lib/localBulk122TicketNative.ts';
const source=readFileSync(file,'utf8');
const compiled=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
assert.equal(compiled.diagnostics.length,0);
const env={NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'sourceindia_qa_test',SOURCEINDIA_TICKET_QA_DB_NAME:'sourceindia_qa_test'};
const app={sql:[],begun:0,commits:0,rollbacks:0,auth:true,reads:[],db:true,mails:[],savedFiles:[],deletedFiles:[]};
const connection={
 async execute(sql,params=[]){
  app.sql.push([sql,params]);
  if(/SELECT fname,lname,email,mobile FROM users/.test(sql))return [[{fname:'QA',lname:'User',email:'qa@example.test',mobile:'0000000000'}],[]];
  if(/INSERT INTO tickets/.test(sql))return [{insertId:12},[]];
  if(/SELECT tickets_id AS id,uuid,user_id/.test(sql))return [[{id:12,uuid:'u',ticket_id:'SOURCE-INDIA-20261127-999'}],[]];
  if(/SELECT tickets_id AS id,otp,token/.test(sql))return [[{id:12,otp:1234,token:'B122OTP:aaaaaaaaaaaaaaaaaaaaaaaa:0',age_seconds:12}],[]];
  if(/SELECT tickets_id AS id,email,token/.test(sql))return [[{id:12,email:'qa@example.test',token:'B122VERIFIED:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',age_seconds:10}],[]];
  if(/SELECT tickets_id AS id,ticket_id,token,fname/.test(sql))return [[{id:12,ticket_id:'SOURCE-INDIA-20261127-999',token:'secret',fname:'QA',lname:'User',email:'qa@example.test',status:0,category:1}],[]];
  if(/SELECT tickets_id AS id,user_id,title,message,priority/.test(sql))return [[{id:12,title:'Edited'}],[]];
  if(/SELECT tickets_id AS id,ticket_id,title,email,fname,lname,status/.test(sql))return [[{id:12,email:'qa@example.test',status:2}],[]];
  if(/SELECT subject,message FROM emails/.test(sql))return [[{subject:'QA OTP',message:Buffer.from('Your OTP {{ OTP }}')}],[]];
  if(/WHERE email=\? AND is_complete=0 ORDER BY/.test(sql))return [[],[]];
  if(/SELECT tickets_id AS id,category,ticket_id,title/.test(sql))return [[{id:12,category:'1',attachment:null}],[]];
  if(/FROM tickets WHERE ticket_id=/.test(sql))return [[{ticket_id:'SOURCE-INDIA-20261127-999',token:'q',email:'qa@example.test'}],[]];
  return [[],[]];
 },
 async beginTransaction(){app.begun++},async commit(){app.commits++},async rollback(){app.rollbacks++},release(){}
};
const pool={execute:(...args)=>connection.execute(...args),getConnection:async()=>connection};
const stub=(path)=>{
 if(path.endsWith('/localAccountDatabase'))return {localAccountDatabase:()=>app.db?pool:null};
 if(path.endsWith('/localBulk121TicketAdmin'))return {ticketAdminScope:async()=>app.auth?{scope:{adminId:1,all:true,category:null}}:{error:Response.json({message:'Unauthorized'},{status:401})}};
 if(path.endsWith('/localBulk123TicketAttachments'))return {parseTicketAttachment:async(file)=>{if(!/\.txt$/.test(file.name))throw Error('TICKET_ATTACHMENT_TYPE');return {filename:'b123_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.txt',buffer:Buffer.from(await file.arrayBuffer()),mediaType:'file'};},persistTicketAttachment:async(file)=>{app.savedFiles.push(file.filename);return file.filename;},removeTicketAttachment:async(name)=>{app.deletedFiles.push(name);},managedTicketFileName:(name)=>typeof name==='string'&&/^b123_[a-f0-9]{32}\.txt$/.test(name),privateTicketAttachmentUrl:(id,name)=>`/v2/api/tickets/attachments/${id}/${name}`};
 if(path==='node:crypto')return require('node:crypto');
 if(path==='nodemailer')return {__esModule:true,default:{createTransport:()=>({sendMail:async(message)=>{app.mails.push(message)},close(){}})}};
 throw Error('unexpected require '+path);
};
const context={module:{exports:{}},exports:{},require:stub,process:{env},Buffer,Response,Request,URL,URLSearchParams,Number,Date,console,Object,RegExp,Set,Error,Math,Intl};
context.exports=context.module.exports;
runInNewContext(compiled.outputText,context,{filename:'localBulk122TicketNative.js'});
const api=context.module.exports;
const request=(method,path,body={},type='application/json')=>{
 const req=new Request('http://localhost:3000'+path,{method,headers:{'content-type':type},body:method==='DELETE'?undefined:type==='application/json'?JSON.stringify(body):body});
 req.cookies={get:()=>undefined};return req;
};
const reset=()=>{app.sql.length=0;app.mails.length=0;app.savedFiles.length=0;app.deletedFiles.length=0;app.begun=0;app.commits=0;app.rollbacks=0;app.db=true;app.auth=true;
 for(const key of Object.keys(env))if(key.startsWith('SOURCEINDIA_TICKET_QA_SMTP_')||key==='SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED'||key==='SOURCEINDIA_TICKET_QA_MAIL_ALLOWLIST'||key==='SOURCEINDIA_TICKET_QA_MAIL_FROM')delete env[key];env.NODE_ENV='development';};
const labels=[
 ['route.ts','POST','create'],['send-otp/route.ts','POST','sendOtp'],['verify-otp/route.ts','POST','verifyOtp'],
 ['store-ticket/route.ts','POST','store'],['track-ticket/route.ts','POST','track'],
 ['store-support-ticket-reply/route.ts','POST','reply'],['[id]/route.ts','PUT','update'],
 ['[id]/status/route.ts','PATCH','status'],['[id]/route.ts','DELETE','delete']
];
test('nine original ticket write method/path exports are native, never fallback bridge',()=>{
 const routes=readFileSync('legacy/sourceindia-express/routes/ticketRoutes.js','utf8');
 assert.equal([...routes.matchAll(/router\.(post|put|patch|delete)\(/g)].length,9);
 for(const [filename,method,op] of labels){
  const route='src/app/v2/api/tickets/'+filename;
  assert.ok(existsSync(route),route);
  const text=readFileSync(route,'utf8');
  assert.match(text,new RegExp(`export async function ${method}\\(`),route);
  assert.ok(text.includes(`nativeTicketWrite(req,'${op}'`),route);
  assert.doesNotMatch(text,/guardedLegacyTicketWrite/,route);
 }
 assert.equal(Object.keys(api.nativeTicketMethods).length,9);
});
test('production, absent QA toggle, remote and unverified DB are denied before any SQL',async()=>{
 reset();
 const body=request('POST','/v2/api/tickets/send-otp',{email:'qa@example.test'});
 assert.equal((await api.nativeTicketWrite(body,'sendOtp')).status,403);
 env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';env.NODE_ENV='production';
 assert.equal((await api.nativeTicketWrite(body,'sendOtp')).status,403);
 env.NODE_ENV='development';env.DB_HOST='remote.example';
 assert.equal((await api.nativeTicketWrite(body,'sendOtp')).status,403);
 env.DB_HOST='127.0.0.1';env.DB_NAME='sourceindia_production';
 assert.equal((await api.nativeTicketWrite(body,'sendOtp')).status,403);
 env.DB_NAME='sourceindia_qa_test';
 assert.equal(app.sql.length,0);
});
test('cross-origin browser requests are rejected before any SQL',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const req=new Request('http://localhost:3000/v2/api/tickets/send-otp',{
  method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:'{"email":"qa@example.test"}'});
 const response=await api.nativeTicketWrite(req,'sendOtp');
 assert.equal(response.status,403);assert.equal(app.sql.length,0);
});
test('QA gate is exact DB name, requires qa/test/sandbox tag and local host',()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 assert.equal(api.ticketQaGate(),null);
 assert.match(api.ticketQaGate({...env,DB_NAME:'sourceindia'}),/isolated/);
 assert.match(api.ticketQaGate({...env,DB_HOST:'192.168.1.2'}),/local database/);
});
test('malformed JSON, unsupported formats, duplicate form fields, and typed attachments are handled safely',async()=>{
 reset();
 const requestBad=new Request('http://localhost/',{method:'POST',headers:{'content-type':'application/json'},body:'{'});
 assert.equal((await api.readTicketBody(requestBad)).status,400);
 const dup=new Request('http://localhost/',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'email=a&email=b'});
 assert.equal((await api.readTicketBody(dup)).status,400);
 const f=new FormData();f.append('attachment',new Blob(['secret']), 'secret.txt');
 const upload=new Request('http://localhost/',{method:'POST',body:f});
 const parsed=await api.readTicketBody(upload);assert.equal(parsed.__attachment.filename,'b123_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.txt');
 const bad=new FormData();bad.append('attachment',new Blob(['MZ']), 'payload.exe');
 assert.equal((await api.readTicketBody(new Request('http://localhost/',{method:'POST',body:bad}))).status,400);
 const valid=await api.readTicketBody(request('POST','/v2/api/tickets/',{title:'Hi'}));
 assert.equal(valid.title,'Hi');
});
test('OTP is never sent without isolated QA SMTP allowlist; DB not modified',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const res=await api.nativeTicketWrite(request('POST','/v2/api/tickets/send-otp',{email:'qa@example.test'}),'sendOtp');
 assert.equal(res.status,503);assert.equal(app.sql.length,0);
});
test('OTP verification records failed attempts inside a committed transaction',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const result=await api.nativeTicketWrite(request('POST','/v2/api/tickets/verify-otp',{email:'qa@example.test',otp:'9999'}),'verifyOtp');
 assert.equal(result.status,400);assert.equal(app.begun,1);assert.equal(app.commits,1);assert.equal(app.rollbacks,0);
 assert.ok(app.sql.some(([sql,args])=>sql.includes('UPDATE tickets SET token=?')&&args[0]==='B122OTP:aaaaaaaaaaaaaaaaaaaaaaaa:1'));
});
test('OTP verification succeeds for matching valid OTP with single-use marker',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/verify-otp',{email:'qa@example.test',otp:'1234'}),'verifyOtp');
 assert.equal(response.status,200);assert.equal((await response.json()).success,2);
 assert.ok(app.sql.some(([sql,args])=>sql.includes('otp=NULL')&&args[0].startsWith('B122VERIFIED:')));
});
test('admin ticket creation performs two SQL inserts within one transaction',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const body={user_id:5,title:'QA ticket',message:'A safely stored support message',priority:'high',category:'1',status:0};
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/',body),'create');
 assert.equal(response.status,201);assert.equal(app.commits,1);
 assert.ok(app.sql.some(([sql])=>sql.includes('INSERT INTO tickets')));
 assert.ok(app.sql.some(([sql])=>sql.includes('INSERT INTO ticket_replies')));
});
test('admin-scoped mutation rejects missing admin authorization',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';app.auth=false;
 const response=await api.nativeTicketWrite(request('PATCH','/v2/api/tickets/12/status',{status:2}),'status','12');
 assert.equal(response.status,401);assert.equal(app.sql.length,0);app.auth=true;
});
test('delete refuses records with existing attachments rather than orphaning files',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const original=connection.execute;
 connection.execute=async(sql,args)=>sql.includes('SELECT tickets_id AS id,category,ticket_id,title')?[[{id:12,category:'1',attachment:'old.pdf'}],[]]:original(sql,args);
 try{
  const res=await api.nativeTicketWrite(request('DELETE','/v2/api/tickets/12'),'delete','12');
  assert.equal(res.status,501);assert.equal(app.rollbacks,1);
  assert.ok(!app.sql.some(([sql])=>sql.includes('DELETE FROM tickets')));
 }finally{connection.execute=original;}
});
test('public reply requires a ticket token and will not mutate unauthenticated',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';app.auth=false;
 const res=await api.nativeTicketWrite(request('POST','/v2/api/tickets/store-support-ticket-reply',{id:'SOURCE-INDIA-20261127-999',message:'Hello'}),'reply');
 assert.equal(res.status,401);assert.ok(!app.sql.some(([sql])=>sql.includes('INSERT INTO ticket_replies')));
 app.auth=true;
});
test('user supplied reply HTML is escaped',()=>{
 assert.equal(api.safeTicketHtml('<script>alert("X")</script>'),'&lt;script&gt;alert(&quot;X&quot;)&lt;/script&gt;');
});

test('admin aliases exist under the path-scoped admin session cookie',()=>{
 const files={
  'src/app/admin/api/local/tickets/route.ts':'POST',
  'src/app/admin/api/local/tickets/[id]/route.ts':'PUT',
  'src/app/admin/api/local/tickets/[id]/status/route.ts':'PATCH'
 };
 for(const [file,method] of Object.entries(files)){
  const src=readFileSync(file,'utf8');assert.match(src,new RegExp(`export async function ${method}\\(`));
  assert.ok(src.includes('nativeTicketWrite('));
 }
});
test('tracking success returns token only after exact email and ticket match',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/track-ticket',
  {email:'qa@example.test',ticketId:'SOURCE-INDIA-20261127-999'}),'track');
 assert.equal(response.status,200);assert.equal((await response.json()).token,'q');
 assert.ok(app.sql.every(([sql,args])=>!sql.includes('FROM tickets')||args.includes('qa@example.test')));
});
test('store-ticket consumes verified marker and inserts reply in one DB transaction',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const body={email:'qa@example.test',ticket_id:12,first_name:'QA',last_name:'User',title:'Subject',message:'Text'};
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/store-ticket',body),'store');
 assert.equal(response.status,200);assert.equal((await response.json()).success,true);
 assert.equal(app.commits,1);assert.ok(app.sql.some(([sql])=>sql.includes('INSERT INTO ticket_replies')));
});
test('admin status update uses scoped lock and is_complete for resolution',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const response=await api.nativeTicketWrite(request('PATCH','/v2/api/tickets/12/status',{status:2}),'status','12');
 assert.equal(response.status,200);assert.equal(app.commits,1);
 assert.ok(app.sql.some(([sql,args])=>sql.includes('is_complete=CASE')&&args[0]===2));
});
test('admin ticket edit uses bind parameters and preserves atomicity',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const body={user_id:5,title:'QA edit',message:'<b>QA text</b>',priority:'low',category:'1',status:1};
 const response=await api.nativeTicketWrite(request('PUT','/v2/api/tickets/12',body),'update','12');
 assert.equal(response.status,200);assert.equal(app.commits,1);
 assert.ok(app.sql.some(([sql,args])=>sql.includes('UPDATE tickets SET user_id=?')&&args.includes('<b>QA text</b>')));
});
test('authorized delete deletes replies then ticket in same transaction',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const response=await api.nativeTicketWrite(request('DELETE','/v2/api/tickets/12'),'delete','12');
 assert.equal(response.status,200);assert.equal(app.commits,1);
 const statements=app.sql.map(([sql])=>sql);
 assert.ok(statements.findIndex(x=>x.includes('DELETE FROM ticket_replies'))<statements.findIndex(x=>x.includes('DELETE FROM tickets')));
});
test('authorized token-based guest reply is recorded and escaped',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';app.auth=false;
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/store-support-ticket-reply',
  {id:'SOURCE-INDIA-20261127-999',message:'<script>x</script>',token:'secret'}),'reply');
 assert.equal(response.status,200);const out=await response.json();assert.equal(out.success,1);
 assert.ok(out.view.includes('&lt;script&gt;'));assert.equal(app.commits,1);
 assert.ok(app.sql.some(([sql])=>sql.includes('INSERT INTO ticket_replies')));app.auth=true;
});
test('sender OTP path uses original template 87 and QA recipient allowlist',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 Object.assign(env,{SOURCEINDIA_TICKET_QA_SMTP_HOST:'localhost',SOURCEINDIA_TICKET_QA_SMTP_USER:'qa',
 SOURCEINDIA_TICKET_QA_SMTP_PASSWORD:'qa',SOURCEINDIA_TICKET_QA_MAIL_FROM:'sender@example.test',
 SOURCEINDIA_TICKET_QA_MAIL_ALLOWLIST:'qa@example.test'});
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/send-otp',{email:'qa@example.test'}),'sendOtp');
 assert.equal(response.status,200);const out=await response.json();assert.equal(out.success,1);
 assert.equal(app.mails.length,1);assert.equal(app.mails[0].to,'qa@example.test');
 assert.equal(app.mails[0].from.address,'sender@example.test');
 assert.equal(app.mails[0].from.name,'SourceIndia QA Support');
 assert.equal(app.commits,1);
 assert.ok(app.sql.some(([sql,args])=>sql.includes('email_id=?')&&args[0]===87));
});

test('BULK123 admin multipart ticket stores validated attachment in both ticket and initial reply',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const form=new FormData();
 for(const [key,value] of Object.entries({user_id:'5',title:'QA attachment',message:'QA message',priority:'high',category:'1',status:'0'}))form.append(key,value);
 form.append('attachment',new Blob(['QA text'],{type:'text/plain'}),'qa.txt');
 const req=new Request('http://localhost:3000/v2/api/tickets/',{method:'POST',body:form});
 const response=await api.nativeTicketWrite(req,'create');
 assert.equal(response.status,201);assert.equal(app.savedFiles.length,1);assert.equal(app.deletedFiles.length,0);
 const inserts=app.sql.filter(([sql])=>sql.includes('INSERT INTO tickets')||sql.includes('INSERT INTO ticket_replies'));
 assert.equal(inserts.length,2);assert.ok(inserts.every(([,args])=>args.includes(app.savedFiles[0])));
 assert.ok(inserts.find(([sql,args])=>sql.includes('ticket_replies')&&args.includes('file')));
});
test('BULK123 failed DB operation removes its staged QA attachment',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const original=connection.execute;
 connection.execute=async(sql,args)=>/SELECT fname,lname,email,mobile FROM users/.test(sql)?[[],[]]:original(sql,args);
 try{
  const form=new FormData();
  for(const [key,value] of Object.entries({user_id:'5',title:'QA attachment',message:'QA message',priority:'high',category:'1',status:'0'}))form.append(key,value);
  form.append('attachment',new Blob(['QA text'],{type:'text/plain'}),'qa.txt');
  const response=await api.nativeTicketWrite(new Request('http://localhost:3000/v2/api/tickets/',{method:'POST',body:form}),'create');
  assert.equal(response.status,404);assert.equal(app.rollbacks,1);
  assert.deepEqual(app.deletedFiles,app.savedFiles);
 }finally{connection.execute=original;}
});
test('BULK123 duplicate multipart attachment fields are rejected before DB transaction',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 const form=new FormData();form.append('attachment',new Blob(['one']),'one.txt');form.append('attachment',new Blob(['two']),'two.txt');
 const response=await api.nativeTicketWrite(new Request('http://localhost:3000/v2/api/tickets/',{method:'POST',body:form}),'create');
 assert.equal(response.status,400);assert.equal(app.sql.length,0);assert.equal(app.savedFiles.length,0);
});
test('BULK123 sends both store email template IDs only to configured QA allowlist',async()=>{
 reset();env.SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED='1';
 Object.assign(env,{SOURCEINDIA_TICKET_QA_NOTIFICATIONS_ENABLED:'1',SOURCEINDIA_TICKET_QA_SMTP_HOST:'localhost',
 SOURCEINDIA_TICKET_QA_SMTP_USER:'qa',SOURCEINDIA_TICKET_QA_SMTP_PASSWORD:'qa',
 SOURCEINDIA_TICKET_QA_MAIL_FROM:'sender@example.test',SOURCEINDIA_TICKET_QA_MAIL_ALLOWLIST:'qa@example.test,admin@example.test',
 SOURCEINDIA_TICKET_QA_ADMIN_EMAIL:'admin@example.test'});
 const body={email:'qa@example.test',ticket_id:12,first_name:'QA',last_name:'User',title:'Subject',message:'Text'};
 const response=await api.nativeTicketWrite(request('POST','/v2/api/tickets/store-ticket',body),'store');
 assert.equal(response.status,200);
 const ids=app.sql.filter(([sql])=>sql.includes('SELECT subject,message FROM emails')).map(([,args])=>args[0]);
 assert.deepEqual(ids,[110,111]);assert.deepEqual(app.mails.map(x=>x.to),['qa@example.test','admin@example.test']);
});
