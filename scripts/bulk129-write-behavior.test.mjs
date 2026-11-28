import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}
const previous={...process.env};
Object.assign(process.env,{
 NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'sourceindia_bulk129_qa_test',
 SOURCEINDIA_CONTACT_WRITES_ENABLED:'1',SOURCEINDIA_CONTACT_QA_DB_NAME:'sourceindia_bulk129_qa_test',
 SOURCEINDIA_CONTACT_QA_TOKEN:'bulk129-contact-token-that-is-over-32-chars',
 SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED:'1',SOURCEINDIA_CONTACT_QA_ADMIN_EMAIL:'admin@example.test',
 SOURCEINDIA_CONTACT_QA_MAIL_FROM:'noreply@example.test',SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST:'admin@example.test,person@example.test',
 SOURCEINDIA_CONTACT_QA_SMTP_HOST:'localhost',SOURCEINDIA_CONTACT_QA_SMTP_USER:'qa',SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD:'qa',
 SOURCEINDIA_FRONT_MENU_WRITES_ENABLED:'1',SOURCEINDIA_FRONT_MENU_QA_DB_NAME:'sourceindia_bulk129_qa_test',
 SOURCEINDIA_FRONT_MENU_QA_TOKEN:'bulk129-menu-token-that-is-over-32-chars'
});
after(()=>{for(const key of Object.keys(process.env)){if(!(key in previous))delete process.env[key];}Object.assign(process.env,previous);});
function transpile(file,mocks){
 const source=readFileSync(file,'utf8');const compiled=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
 const module={exports:{}};
 const customRequire=name=>Object.hasOwn(mocks,name)?mocks[name]:require(name);
 runInNewContext(compiled.outputText,{module,exports:module.exports,require:customRequire,process,Buffer,Response,Request,URL,URLSearchParams,console,Date,Set,Map,Promise,Error,Number,Object,Array,String,RegExp,Math},{filename:file});
 return module.exports;
}
function request(method,path,body,token='contact'){
 const value=token==='contact'?process.env.SOURCEINDIA_CONTACT_QA_TOKEN:process.env.SOURCEINDIA_FRONT_MENU_QA_TOKEN;
 return new Request('http://localhost:3000'+path,{method,headers:{Authorization:'Bearer '+value,'Content-Type':'application/json'},body:JSON.stringify(body)});
}
const fixture={fname:'First',lname:'Last',email:'person@example.test',subject:'Hello',message:'Help please'};
function contactFixture({mailFailure=false,dbFailure=false,emptyTemplates=false}={}){
 const state={records:[],commits:0,rollbacks:0,deliveries:[],events:[]};
 const connection={
  async beginTransaction(){state.events.push('begin');},async commit(){state.commits++;state.events.push('commit');},
  async rollback(){state.rollbacks++;state.events.push('rollback');},release(){state.events.push('release');},
  async execute(sql,params){
   if(sql.startsWith('INSERT INTO contacts')){if(dbFailure)throw Error('DATABASE_UNAVAILABLE');state.records.push({id:1,contact_id:1,fname:params[1],lname:params[2],email:params[3]});state.events.push('insert');return [{insertId:1}];}
   if(sql.includes('FROM contacts WHERE contact_id='))return [state.records];
   if(sql.startsWith('SELECT email_id'))return [[{email_id:61,subject:'Admin',message:emptyTemplates?null:'{{ USER_FNAME }} {{ MESSAGE }}'},{email_id:59,subject:'User',message:emptyTemplates?'':'{{ USER_FNAME }}'}]];
   throw Error('Unexpected SQL '+sql);
  }
 };
 const mailer={sendMail:async opts=>{state.events.push('send:'+opts.to);state.deliveries.push(opts);if(mailFailure&&state.deliveries.length===2)throw Error('SMTP_FAILED');},close:()=>{}};
 const module=transpile('src/lib/localBulk127Contacts.ts',{
  '@/lib/localAccountDatabase':{localAccountDatabase:()=>({getConnection:async()=>connection})},
  nodemailer:{default:{createTransport:()=>mailer},createTransport:()=>mailer}
 });
 return {state,module};
}
test('Contacts: successful QA create commits before admin and user SMTP notifications',async()=>{
 const {state,module}=contactFixture();const response=await module.createContact(request('POST','/v2/api/contacts/',fixture));
 assert.equal(response.status,200);assert.equal((await response.json()).success,true);
 assert.deepEqual(state.events.filter(e=>e==='commit'||e.startsWith('send:')),['commit','send:admin@example.test','send:person@example.test']);
 assert.equal(state.records.length,1);assert.equal(state.rollbacks,0);
});
test('Contacts: null and blank template messages use original Express fallback HTML, not literal null',async()=>{
 const {state,module}=contactFixture({emptyTemplates:true});
 const response=await module.createContact(request('POST','/v2/api/contacts/',fixture));
 assert.equal(response.status,200);
 assert.match(state.deliveries[0].html,/New message from First Last/);
 assert.match(state.deliveries[1].html,/Hi First, thank you for contacting us!/);
 assert.doesNotMatch(state.deliveries[0].html,/null|undefined/);
 assert.doesNotMatch(state.deliveries[1].html,/null|undefined/);
});
test('Contacts: partial SMTP failure retains previously committed contact, exactly as Express save-first flow',async()=>{
 const {state,module}=contactFixture({mailFailure:true});const response=await module.createContact(request('POST','/v2/api/contacts/',fixture));
 assert.equal(response.status,500);assert.equal((await response.json()).success,false);
 assert.equal(state.commits,1);assert.equal(state.rollbacks,0);assert.equal(state.records.length,1);
 assert.equal(state.deliveries.length,2);
});
test('Contacts: database insert failure rolls back and does not send email',async()=>{
 const {state,module}=contactFixture({dbFailure:true});const response=await module.createContact(request('POST','/v2/api/contacts/',fixture));
 assert.equal(response.status,500);assert.equal(state.rollbacks,1);assert.equal(state.commits,0);assert.equal(state.deliveries.length,0);
});
test('Contacts: wrong bearer token blocks all DB/mail access',async()=>{
 const {state,module}=contactFixture();const requestBad=new Request('http://localhost:3000/v2/api/contacts/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture)});
 assert.equal((await module.createContact(requestBad)).status,401);assert.equal(state.events.length,0);
});
test('Front Menu: production and missing QA token block writes before SQL',async()=>{
 let calls=0;const module=transpile('src/lib/localBulk128FrontMenu.ts',{'@/lib/localAccountDatabase':{localAccountDatabase:()=>{calls++;throw Error('DB must not be accessed');}}});
 const body={name:'QA Menu',link:'/',parent_id:0,type:1,position:1,is_show:1,status:1};
 const noToken=new Request('http://localhost:3000/v2/api/front_menu/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await module.createMenu(noToken)).status,401);assert.equal(calls,0);
 const old=process.env.NODE_ENV;process.env.NODE_ENV='production';try{assert.equal((await module.createMenu(request('POST','/v2/api/front_menu/',body,'menu'))).status,403);}finally{process.env.NODE_ENV=old;}
 assert.equal(calls,0);
});
test('Front Menu: invalid mutation flags fail before DB access',async()=>{
 let calls=0;const module=transpile('src/lib/localBulk128FrontMenu.ts',{'@/lib/localAccountDatabase':{localAccountDatabase:()=>{calls++;throw Error('should not use DB');}}});
 const response=await module.updateMenuFlag(request('PATCH','/v2/api/front_menu/1/status',{status:2},'menu'),'1','status');
 assert.equal(response.status,400);assert.equal(calls,0);
});
function menuFixture({failSql=''}={}){
 const state={records:new Map(),nextId:0,commits:0,rollbacks:0,releases:0};
 let snapshot;
 const con={
  async beginTransaction(){snapshot=new Map([...state.records].map(([id,row])=>[id,{...row}]));},
  async commit(){state.commits++;},
  async rollback(){state.rollbacks++;state.records=new Map([...snapshot].map(([id,row])=>[id,{...row}]));},
  release(){state.releases++;},
  async execute(sql,args=[]){
   if(failSql&&sql.includes(failSql))throw Error('SQL_FAIL');
   if(sql.startsWith('INSERT INTO front_menu')){
    const id=++state.nextId;const [uuid,parent_id,name,link,is_show,status,type,position]=args;
    state.records.set(id,{id,uuid,parent_id,name,link,is_show,status,type,position});return [{insertId:id}];
   }
   if(sql.startsWith('SELECT')&&sql.includes('FROM front_menu WHERE front_menu_id=?'))return [[state.records.get(args[0])].filter(Boolean)];
   if(sql.startsWith('UPDATE front_menu SET parent_id=')){
    const [parent_id,name,link,is_show,status,type,position,id]=args;
    Object.assign(state.records.get(id),{parent_id,name,link,is_show,status,type,position});return [{affectedRows:1}];
   }
   if(sql.startsWith('UPDATE front_menu SET status=')){state.records.get(args[1]).status=args[0];return [{affectedRows:1}];}
   if(sql.startsWith('UPDATE front_menu SET is_show=')){state.records.get(args[1]).is_show=args[0];return [{affectedRows:1}];}
   if(sql.startsWith('DELETE FROM front_menu')){state.records.delete(args[0]);return [{affectedRows:1}];}
   throw Error('Unexpected SQL: '+sql);
  }
 };
 const module=transpile('src/lib/localBulk128FrontMenu.ts',{'@/lib/localAccountDatabase':{localAccountDatabase:()=>({getConnection:async()=>con})}});
 return {state,module};
}
const menuBody={parent_id:0,name:'QA Menu',link:'/qa',is_show:1,status:1,type:1,position:2};
test('Front Menu: create, edit and flags preserve original response messages and fields',async()=>{
 const {state,module}=menuFixture();
 const created=await module.createMenu(request('POST','/v2/api/front_menu/',menuBody,'menu'));
 assert.equal(created.status,201);const createdBody=await created.json();assert.equal(createdBody.message,'Front menu created');assert.equal(createdBody.frontMenu.name,'QA Menu');
 const edit=await module.updateMenu(request('PUT','/v2/api/front_menu/1',{...menuBody,name:'Edited'},'menu'),'1');
 assert.equal(edit.status,200);assert.equal((await edit.json()).frontMenu.name,'Edited');
 const status=await module.updateMenuFlag(request('PATCH','/v2/api/front_menu/1/status',{status:0},'menu'),'1','status');
 assert.equal((await status.json()).message,'Status updated');assert.equal(state.records.get(1).status,0);
 const shown=await module.updateMenuFlag(request('PATCH','/v2/api/front_menu/1/is_show',{is_show:0},'menu'),'1','is_show');
 assert.equal((await shown.json()).message,'Show status updated');assert.equal(state.records.get(1).is_show,0);
 assert.equal(state.commits,4);assert.equal(state.rollbacks,0);assert.equal(state.releases,4);
});
test('Front Menu: SQL update failure rolls back and retains previous values',async()=>{
 const {state,module}=menuFixture({failSql:'UPDATE front_menu SET parent_id='});
 assert.equal((await module.createMenu(request('POST','/v2/api/front_menu/',menuBody,'menu'))).status,201);
 const edit=await module.updateMenu(request('PUT','/v2/api/front_menu/1',{...menuBody,name:'Should Roll Back'},'menu'),'1');
 assert.equal(edit.status,503);assert.equal(state.records.get(1).name,'QA Menu');assert.equal(state.rollbacks,1);
});
test('Front Menu: delete removes target and missing records return original 404',async()=>{
 const {state,module}=menuFixture();
 assert.equal((await module.createMenu(request('POST','/v2/api/front_menu/',menuBody,'menu'))).status,201);
 const gone=await module.deleteMenu(request('DELETE','/v2/api/front_menu/1',{},'menu'),'1');
 assert.equal(gone.status,200);assert.deepEqual(await gone.json(),{message:'Front menu deleted successfully'});
 assert.equal(state.records.size,0);
 const missing=await module.deleteMenu(request('DELETE','/v2/api/front_menu/1',{},'menu'),'1');assert.equal(missing.status,404);
});

test('Front Menu: Sequelize create defaults parent_id and position to 0',async()=>{
 const {state,module}=menuFixture();
 const {parent_id,position,...minimal}=menuBody;
 const created=await module.createMenu(request('POST','/v2/api/front_menu/',minimal,'menu'));
 assert.equal(created.status,201);
 assert.equal(state.records.get(1).parent_id,0);
 assert.equal(state.records.get(1).position,0);
});
test('Front Menu: partial update preserves existing fields like Express instance.save()',async()=>{
 const {state,module}=menuFixture();
 assert.equal((await module.createMenu(request('POST','/v2/api/front_menu/',menuBody,'menu'))).status,201);
 const response=await module.updateMenu(request('PUT','/v2/api/front_menu/1',{name:'Updated only'},'menu'),'1');
 assert.equal(response.status,200);
 const current=state.records.get(1);
 assert.equal(current.name,'Updated only');
 assert.equal(current.link,'/qa');
 assert.equal(current.position,2);
 assert.equal(current.type,1);
 assert.equal(current.status,1);
});
test('Front Menu: form-urlencoded numeric fields use Express-compatible parsing',async()=>{
 const {state,module}=menuFixture();
 const encoded=new URLSearchParams(Object.entries(menuBody).map(([key,value])=>[key,String(value)]));
 const req=new Request('http://localhost:3000/v2/api/front_menu/',{
  method:'POST',headers:{Authorization:'Bearer '+process.env.SOURCEINDIA_FRONT_MENU_QA_TOKEN,'Content-Type':'application/x-www-form-urlencoded'},body:encoded.toString()
 });
 const response=await module.createMenu(req);
 assert.equal(response.status,201);
 assert.equal(state.records.get(1).type,1);
 assert.equal(state.records.get(1).position,2);
});
test('Front Menu: duplicate form fields and malformed flag are rejected before DB',async()=>{
 let accesses=0;
 const module=transpile('src/lib/localBulk128FrontMenu.ts',{'@/lib/localAccountDatabase':{localAccountDatabase:()=>{accesses++;throw Error('unexpected DB');}}});
 const payload='name=good&name=evil&link=%2F&type=1&status=1&is_show=1';
 const req=new Request('http://localhost:3000/v2/api/front_menu/',{
  method:'POST',headers:{Authorization:'Bearer '+process.env.SOURCEINDIA_FRONT_MENU_QA_TOKEN,'Content-Type':'application/x-www-form-urlencoded'},body:payload
 });
 assert.equal((await module.createMenu(req)).status,400);
 assert.equal(accesses,0);
});

test('BULK134 Contacts: preserve submitted email capitalization while matching QA recipient allowlist case-insensitively',async()=>{
 const {state,module}=contactFixture();
 const originalEmail='Person@Example.Test';
 const response=await module.createContact(request('POST','/v2/api/contacts/',{...fixture,email:originalEmail}));
 assert.equal(response.status,200);
 assert.equal(state.records[0].email,originalEmail);
 assert.equal(state.deliveries[1].to,originalEmail);
});

test('BULK134 Front Menu: preserve meaningful leading/trailing menu-name whitespace like Express create/update',async()=>{
 const {state,module}=menuFixture();
 const created=await module.createMenu(request('POST','/v2/api/front_menu/',{...menuBody,name:'  QA Menu  '},'menu'));
 assert.equal(created.status,201);
 assert.equal(state.records.get(1).name,'  QA Menu  ');
 const updated=await module.updateMenu(request('PUT','/v2/api/front_menu/1',{name:'  Updated  '},'menu'),'1');
 assert.equal(updated.status,200);
 assert.equal(state.records.get(1).name,'  Updated  ');
});
