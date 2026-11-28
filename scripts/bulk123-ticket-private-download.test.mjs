import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const file='src/lib/localBulk123TicketDownload.ts';
const compiled=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
assert.equal(compiled.diagnostics.length,0);
const filename='b123_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.txt';
const state={enabled:false,admin:false,category:2,query:[],loaded:0};
const connection={execute:async(sql,args)=>{
 state.query.push([sql,args]);
 if(sql.includes('FROM tickets WHERE'))return [[{tickets_id:7,category:2,token:'secret123',attachment:filename}],[]];
 if(sql.includes('FROM ticket_replies'))return [[],[]];
 return [[],[]];
}};
const stubs=path=>{
 if(path==='@/lib/localAccountDatabase')return {localAccountDatabase:()=>connection};
 if(path==='@/lib/localBulk122TicketNative')return {ticketQaGate:()=>state.enabled?null:'disabled'};
 if(path==='@/lib/localBulk121TicketAdmin')return {ticketAdminScope:async()=>state.admin?{scope:{adminId:1,all:false,category:state.category}}:{error:Response.json({message:'Unauthorized'},{status:401})}};
 if(path==='@/lib/localBulk123TicketAttachments')return {managedTicketFileName:name=>name===filename,loadTicketAttachment:async()=>{state.loaded++;return Buffer.from('QA secret attachment')}};
 if(path==='node:crypto')return require('node:crypto');
 throw Error('unexpected mock import '+path);
};
const context={module:{exports:{}},exports:{},require:stubs,process,Buffer,Response,Request,Uint8Array,Number,Error};context.exports=context.module.exports;
runInNewContext(compiled.outputText,context);
const api=context.module.exports;
const url='http://localhost:3000/v2/api/tickets/attachments/7/'+filename;
const req=headers=>new Request(url,{headers});
test('production/default gates block files before DB and filesystem',async()=>{
 state.enabled=false;state.query=[];state.loaded=0;
 const response=await api.privateTicketDownload(req({'authorization':'Bearer secret123'}),'7',filename);
 assert.equal(response.status,403);assert.equal(state.loaded,0);assert.equal(state.query.length,0);
});
test('anonymous and incorrect ticket bearer tokens do not reveal bytes',async()=>{
 state.enabled=true;state.admin=false;state.query=[];state.loaded=0;
 assert.equal((await api.privateTicketDownload(req({}),'7',filename)).status,401);
 assert.equal((await api.privateTicketDownload(req({'authorization':'Bearer wrongtoken'}),'7',filename)).status,401);
 assert.equal(state.loaded,0);
});
test('valid tracker token downloads private QA bytes with secure headers',async()=>{
 state.enabled=true;state.admin=false;state.loaded=0;
 const response=await api.privateTicketDownload(req({'authorization':'Bearer secret123'}),'7',filename);
 assert.equal(response.status,200);
 assert.equal(await response.text(),'QA secret attachment');
 assert.equal(response.headers.get('content-type'),'application/octet-stream');
 assert.match(response.headers.get('content-disposition'),/attachment;/);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal(state.loaded,1);
});
test('admin role/category guard protects download and validates paths',async()=>{
 state.enabled=true;state.admin=true;state.category=99;state.loaded=0;
 assert.equal((await api.privateTicketDownload(req({}),'7',filename)).status,403);
 state.category=2;
 assert.equal((await api.privateTicketDownload(req({}),'7',filename)).status,200);
 assert.equal((await api.privateTicketDownload(req({}),'../../7',filename)).status,400);
 assert.equal((await api.privateTicketDownload(req({}),'7','../invalid.pdf')).status,400);
});
