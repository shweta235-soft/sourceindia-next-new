import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{const bin=execFileSync(process.platform==='win32'?'where':'which',['tsc'],{encoding:'utf8'}).split(/\r?\n/)[0];ts=require(resolve(dirname(realpathSync(bin)),'../lib/typescript.js'));}
const temp=mkdtempSync(join(tmpdir(),'sourceindia-bulk126-qa-test-'));
const oldEnv={...process.env};
Object.assign(process.env,{NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'sourceindia_application_qa_test',SOURCEINDIA_APPLICATION_WRITES_ENABLED:'1',SOURCEINDIA_APPLICATION_QA_DB_NAME:'sourceindia_application_qa_test',SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT:temp,SOURCEINDIA_APPLICATION_QA_TOKEN:'QA-test-key-for-local-bulk126-32-bytes-plus'});
after(()=>{for(const key of ['NODE_ENV','DB_HOST','DB_NAME','SOURCEINDIA_APPLICATION_WRITES_ENABLED','SOURCEINDIA_APPLICATION_QA_DB_NAME','SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT','SOURCEINDIA_APPLICATION_QA_TOKEN']){
 if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];
}rmSync(temp,{recursive:true,force:true});});
const filePath='src/lib/localBulk126ApplicationFiles.ts';
function loadTs(file,overrides={}){
 const text=readFileSync(file,'utf8');const transpiled=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
 assert.equal(transpiled.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const mod={exports:{}};
 const context={module:mod,exports:mod.exports,require:(n)=>n in overrides?overrides[n]:require(n),process,Buffer,Response,Request,File,FormData,URL,console,Number,Date,Set,Object,Promise,Error};
 runInNewContext(transpiled.outputText,context,{filename:file});return mod.exports;
}
const files=loadTs(filePath);
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,1,2,3]);
function payload({name='QA Application',status='1',top_category='0',withFile=true,content=png}={}){
 const form=new FormData();form.set('name',name);form.set('status',status);form.set('top_category',top_category);
 if(withFile)form.set('file',new File([content],'company.png',{type:'image/png'}));return form;
}
const token=process.env.SOURCEINDIA_APPLICATION_QA_TOKEN;
function req(method,url,form,authorized=true){return new Request(`http://localhost:3000${url}`,{method,body:form,headers:authorized?{Authorization:`Bearer ${token}`}:{}});}
function snapshot(state){return structuredClone(state);}
function fakeDb({breakSql}={}){
 const state={applications:{},images:{},lastImage:0,lastApp:0};let rollbackCount=0,commitCount=0;
 const con={
  async beginTransaction(){con.old=snapshot(state);},
  async commit(){commitCount++;},
  async rollback(){rollbackCount++;Object.assign(state,snapshot(con.old));},
  release(){},
  async execute(sql,args=[]){
   if(breakSql&&sql.includes(breakSql))throw Error('MOCK_DB_FAILURE');
   if(sql.startsWith('INSERT INTO upload_images')){
    const id=++state.lastImage;state.images[id]={upload_image_id:id,uuid:args[0],file:args[1]};return [{insertId:id}];
   }
   if(sql.startsWith('INSERT INTO applications')){
    const id=++state.lastApp;state.applications[id]={id,uuid:args[0],name:args[1],cat_file_id:args[2],status:args[3],top_category:args[4],is_delete:0,stock_file_id:null,prefix:null,created_at:'2026-11-27T00:00:00.000Z',updated_at:'2026-11-27T00:00:00.000Z'};return [{insertId:id}];
   }
   if(sql.includes('FROM applications a WHERE a.application_id=? FOR UPDATE'))return [[state.applications[args[0]]].filter(Boolean)];
   if(sql.startsWith('SELECT upload_image_id,file FROM upload_images'))return [[state.images[args[0]]].filter(Boolean)];
   if(sql.startsWith('SELECT COUNT(*) AS count FROM applications WHERE cat_file_id=?'))return [[{count:Object.values(state.applications).filter(x=>x.cat_file_id===args[0]).length}]];
   if(sql.startsWith('UPDATE upload_images')){state.images[args[1]].file=args[0];return [{affectedRows:1}];}
   if(sql.startsWith('UPDATE applications SET name=')){
    const [name,top_category,status,cat_file_id,id]=args;Object.assign(state.applications[id],{name,top_category,status,cat_file_id});return [{affectedRows:1}];
   }
   if(sql.startsWith('UPDATE applications SET status=')){const [value,id]=args;state.applications[id].status=value;return [{affectedRows:1}];}
   if(sql.startsWith('UPDATE applications SET top_category=')){const [value,id]=args;state.applications[id].top_category=value;return [{affectedRows:1}];}
   if(sql.startsWith('UPDATE applications SET is_delete=')){const [value,id]=args;state.applications[id].is_delete=value;return [{affectedRows:1}];}
   if(sql.startsWith('DELETE FROM applications')){delete state.applications[args[0]];return [{affectedRows:1}];}
   if(sql.startsWith('DELETE FROM upload_images')){delete state.images[args[0]];return [{affectedRows:1}];}
   throw Error('Unexpected SQL: '+sql);
  },
  async query(sql,args=[]){
   if(sql.includes('WHERE application_id IN (')&&sql.startsWith('SELECT'))return [Object.values(state.applications).filter(x=>args.includes(x.id)&&x.is_delete===0).map(x=>({application_id:x.id}))];
   if(sql.startsWith('UPDATE applications SET is_delete=1')){for(const id of args){if(state.applications[id])state.applications[id].is_delete=1;}return [{affectedRows:args.length}];}
   throw Error('Unexpected query: '+sql);
  }
 };
 return {state,con,pool:{getConnection:async()=>con},get rollbackCount(){return rollbackCount;},get commitCount(){return commitCount;}};
}
function app(db){return loadTs('src/lib/localBulk126Applications.ts',{'@/lib/localAccountDatabase':{localAccountDatabase:()=>db.pool},'@/lib/localBulk126ApplicationFiles':files});}
test('file validation rejects path traversal, executable payload and forged png',async()=>{
 for(const file of [new File(['MZ'],'virus.exe',{type:'application/octet-stream'}),new File(['fake'],'fake.png',{type:'image/png'}),new File([png],'../image.png',{type:'image/png'})])await assert.rejects(files.applicationImage(file));
 await assert.rejects(files.applicationImage(new File([new Uint8Array(6*1024*1024+1)],'large.png',{type:'image/png'})));
 assert.throws(()=>files.applicationFilePath('upload/applications/../secret.png'));
 assert.throws(()=>files.applicationFilePath('../../secret.png'));
});
test('production writes and invalid QA token fail before DB or filesystem',async()=>{
 const db=fakeDb(),m=app(db);
 const original=process.env.NODE_ENV;process.env.NODE_ENV='production';
 const result=await m.createApplications(req('POST','/v2/api/applications/',payload()));assert.equal(result.status,403);process.env.NODE_ENV=original;
 const denied=await m.createApplications(req('POST','/v2/api/applications/',payload(),false));assert.equal(denied.status,401);
 assert.equal(db.state.lastImage,0);assert.equal(db.state.lastApp,0);
});
test('create multipart inserts image+application in transaction and matches response keys',async()=>{
 const db=fakeDb(),m=app(db);
 const response=await m.createApplications(req('POST','/v2/api/applications/',payload()));
 assert.equal(response.status,201);const data=await response.json();assert.equal(data.message,'Application created');assert.equal(data.applications.name,'QA Application');
 assert.equal(db.commitCount,1);const image=db.state.images[1];assert.match(image.file,/^upload\/applications\/b126_[a-f0-9]{32}\.png$/);
 assert.ok(existsSync(files.applicationFilePath(image.file)));
 assert.equal(db.state.applications[1].cat_file_id,1);
});
test('update replaces QA image, discards original only after successful DB commit',async()=>{
 const db=fakeDb(),m=app(db);
 await m.createApplications(req('POST','/v2/api/applications/',payload({name:'Original'})));
 const previous=db.state.images[1].file,previousFile=files.applicationFilePath(previous);
 const response=await m.updateApplications(req('PUT','/v2/api/applications/1',payload({name:'Updated'})),'1');
 assert.equal(response.status,200);assert.equal((await response.json()).applications.name,'Updated');
 assert.equal(db.state.images[1].upload_image_id,1);assert.notEqual(db.state.images[1].file,previous);
 assert.equal(existsSync(previousFile),false);assert.equal(existsSync(files.applicationFilePath(db.state.images[1].file)),true);
});
test('update without new image preserves image reference and file',async()=>{
 const db=fakeDb(),m=app(db);
 await m.createApplications(req('POST','/v2/api/applications/',payload()));
 const previous=db.state.images[1].file;
 const response=await m.updateApplications(req('PUT','/v2/api/applications/1',payload({withFile:false,name:'Name only'})),'1');
 assert.equal(response.status,200);assert.equal(db.state.images[1].file,previous);assert.ok(existsSync(files.applicationFilePath(previous)));
});
test('SQL insert failure rolls back and removes staged image',async()=>{
 const db=fakeDb({breakSql:'INSERT INTO applications'}),m=app(db);
 const fs=require('node:fs');const root=join(temp,'upload','applications');const before=fs.readdirSync(root).sort();
 const response=await m.createApplications(req('POST','/v2/api/applications/',payload()));assert.equal(response.status,503);assert.equal(db.rollbackCount,1);
 assert.deepEqual(db.state.images,{});assert.deepEqual(db.state.applications,{});
 // No image should remain after rollback.
 assert.deepEqual(fs.readdirSync(root).sort(),before);
});
test('single delete removes the row, image registry and original file together',async()=>{
 const db=fakeDb(),m=app(db);await m.createApplications(req('POST','/v2/api/applications/',payload()));
 const old=db.state.images[1].file,full=files.applicationFilePath(old);
 const response=await m.deleteApplications(req('DELETE','/v2/api/applications/1'),'1');
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{message:'Application deleted successfully'});
 assert.equal(db.state.applications[1],undefined);assert.equal(db.state.images[1],undefined);assert.equal(existsSync(full),false);
});
test('shared image prevents destructive deletion before any SQL change',async()=>{
 const db=fakeDb(),m=app(db);await m.createApplications(req('POST','/v2/api/applications/',payload()));
 db.state.applications[2]={...db.state.applications[1],id:2};
 const r=await m.deleteApplications(req('DELETE','/v2/api/applications/1'),'1');assert.equal(r.status,409);
 assert.equal(db.state.applications[1]?.id,1);assert.ok(existsSync(files.applicationFilePath(db.state.images[1].file)));
});
test('rollback restores quarantined old image when SQL update fails',async()=>{
 const db=fakeDb({breakSql:'UPDATE applications SET name='}),m=app(db);
 // Setup QA fixture directly; create itself would trigger the mock error only during update.
 const file=await files.applicationImage(new File([png],'original.png',{type:'image/png'}));await files.writeApplicationImage(file);
 db.state.lastImage=1;db.state.lastApp=1;db.state.images[1]={upload_image_id:1,file:file.dbPath};
 db.state.applications[1]={id:1,name:'Old',cat_file_id:1,status:1,top_category:0};
 const fs=require('node:fs');const root=join(temp,'upload','applications');const beforeFiles=fs.readdirSync(root).sort();
 const r=await m.updateApplications(req('PUT','/v2/api/applications/1',payload({name:'New'})),'1');
 assert.equal(r.status,503);assert.equal(db.rollbackCount,1);assert.equal(db.state.images[1].file,file.dbPath);
 assert.equal(db.state.applications[1].name,'Old');assert.ok(existsSync(files.applicationFilePath(file.dbPath)));
 const names=fs.readdirSync(root).sort();assert.deepEqual(names,beforeFiles);
});
test('missing ID returns original 404 for edits and deletes',async()=>{
 const db=fakeDb(),m=app(db);
 const update=await m.updateApplications(req('PUT','/v2/api/applications/199',payload({withFile:false})),'199');assert.equal(update.status,404);
 const del=await m.deleteApplications(req('DELETE','/v2/api/applications/199'),'199');assert.equal(del.status,404);
});

test('PATCH status/top_category/is_delete preserve original message and update fields',async()=>{
 const db=fakeDb(),m=app(db);await m.createApplications(req('POST','/v2/api/applications/',payload()));
 for(const [key,value,message] of [['status',0,'Status updated'],['top_category',1,'Category status updated'],['is_delete',1,'Applications is removed']]){
  const request=new Request('http://localhost:3000/v2/api/applications/1/status',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({[key]:value})});
  const response=await m.patchApplications(request,'1',key);assert.equal(response.status,200);const out=await response.json();assert.equal(out.message,message);assert.equal(out.applications[key],value);
 }
 const invalid=new Request('http://localhost:3000/v2/api/applications/1/status',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({status:'1'})});
 assert.equal((await m.patchApplications(invalid,'1','status')).status,400);
});
test('bulk delete soft-flags selected IDs without physical image deletion',async()=>{
 const db=fakeDb(),m=app(db);await m.createApplications(req('POST','/v2/api/applications/',payload()));
 const originalFile=db.state.images[1].file;
 const reqBulk=new Request('http://localhost:3000/v2/api/applications/delete-selected',{method:'DELETE',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({ids:[1]})});
 const result=await m.deleteSelectedApplications(reqBulk);assert.equal(result.status,200);
 assert.equal(db.state.applications[1].is_delete,1);assert.ok(existsSync(files.applicationFilePath(originalFile)));
});
test('SQL delete failure rolls back and restores quarantined image',async()=>{
 const db=fakeDb({breakSql:'DELETE FROM applications'}),m=app(db);
 const img=await files.applicationImage(new File([png],'before.png',{type:'image/png'}));await files.writeApplicationImage(img);
 db.state.lastImage=1;db.state.lastApp=1;db.state.images[1]={upload_image_id:1,file:img.dbPath};db.state.applications[1]={id:1,name:'Original',cat_file_id:1,status:1,top_category:0};
 const root=join(temp,'upload','applications');const fs=require('node:fs');const before=fs.readdirSync(root).sort();
 const result=await m.deleteApplications(req('DELETE','/v2/api/applications/1'),'1');assert.equal(result.status,503);
 assert.equal(db.state.applications[1].name,'Original');assert.ok(existsSync(files.applicationFilePath(img.dbPath)));assert.deepEqual(fs.readdirSync(root).sort(),before);
});
test('create rejects missing file, duplicate name, wrong type without DB writes',async()=>{
 const db=fakeDb(),m=app(db);
 assert.equal((await m.createApplications(req('POST','/v2/api/applications/',payload({withFile:false})))).status,400);
 const form=payload();form.append('name','overwritten');assert.equal((await m.createApplications(req('POST','/v2/api/applications/',form))).status,400);
 const jsonReq=new Request('http://localhost:3000/v2/api/applications/',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'x'})});
 assert.equal((await m.createApplications(jsonReq)).status,400);assert.equal(db.state.lastImage,0);
});
