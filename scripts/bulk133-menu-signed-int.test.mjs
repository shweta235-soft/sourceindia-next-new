import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync('src/lib/localBulk128FrontMenu.ts','utf8');
const original=readFileSync('legacy/sourceindia-express/models/FrontMenu.js','utf8');
function harness(){
 const state={inserts:[],updates:[],commits:0};
 const conn={async beginTransaction(){},async commit(){state.commits++},async rollback(){},release(){},async execute(sql,args=[]){
   if(sql.startsWith('INSERT INTO front_menu')){state.inserts.push(args);return [{insertId:14}];}
   if(sql.startsWith('UPDATE front_menu')){state.updates.push(args);return [{affectedRows:1}];}
   if(sql.startsWith('SELECT front_menu_id AS id'))return [[{id:14,parent_id:0,name:'Header',link:'/',is_show:1,status:1,type:1,position:0}]];
   throw Error('Unexpected SQL: '+sql);
 }};
 const module={exports:{}};
 const compiled=ts.transpileModule(source,{fileName:'src/lib/localBulk128FrontMenu.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const env={...process.env,NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'bulk133_qa_test',SOURCEINDIA_FRONT_MENU_WRITES_ENABLED:'1',SOURCEINDIA_FRONT_MENU_QA_DB_NAME:'bulk133_qa_test',SOURCEINDIA_FRONT_MENU_QA_TOKEN:'bulk133-qa-token-longer-than-thirty-two-characters'};
 vm.runInNewContext(compiled,{module,exports:module.exports,require:id=>id==='@/lib/localAccountDatabase'?{localAccountDatabase:()=>({getConnection:async()=>conn})}:require(id),process:{...process,env},Buffer,Response,Request,URL,URLSearchParams,console,Date,Set,Map,Promise,Error,Number,Object,Array,String,RegExp,Math});
 const request=(method,body)=>new Request('http://localhost:3000/v2/api/front_menu/'+(method==='POST'?'':'14'),{method,headers:{authorization:'Bearer '+env.SOURCEINDIA_FRONT_MENU_QA_TOKEN,'content-type':'application/json'},body:JSON.stringify(body)});
 return {api:module.exports,state,request};
}
const full={parent_id:0,name:'QA menu',link:'/qa',is_show:1,status:1,type:-1,position:-2};
test('original model stores parent, type and position in signed INTEGER columns',()=>{
 for(const key of ['parent_id','type','position'])assert.match(original,new RegExp(key+':\\s*\\{\\s*type:\\s*DataTypes\\.INTEGER'));
});
test('POST supports negative signed type and position like original Sequelize model',async()=>{
 const h=harness(),res=await h.api.createMenu(h.request('POST',full));
 assert.equal(res.status,201);assert.equal(h.state.inserts[0][6],-1);assert.equal(h.state.inserts[0][7],-2);assert.equal(h.state.commits,1);
});
test('PUT supports signed integer partial updates',async()=>{
 const h=harness(),res=await h.api.updateMenu(h.request('PUT',{type:-3,position:-7}),'14');
 assert.equal(res.status,200);assert.equal(h.state.updates[0][5],-3);assert.equal(h.state.updates[0][6],-7);
});
test('out-of-range INT values rejected before database access',async()=>{
 const h=harness();for(const key of ['parent_id','type','position'])for(const value of [-2147483649,2147483648]){
  const res=await h.api.createMenu(h.request('POST',{...full,[key]:value}));assert.equal(res.status,400);
 }
 assert.equal(h.state.inserts.length,0);
});
test('status and is_show remain binary flags despite signed type/position',async()=>{
 const h=harness();for(const key of ['status','is_show']){
  const res=await h.api.createMenu(h.request('POST',{...full,[key]:-1}));assert.equal(res.status,400);
 }
 assert.equal(h.state.inserts.length,0);
});
test('production default-deny remains effective',()=>{
 const h=harness();const response=h.api.frontMenuWriteGate(h.request('POST',full),{NODE_ENV:'production',SOURCEINDIA_FRONT_MENU_WRITES_ENABLED:'1'});
 assert.equal(response.status,403);assert.equal(h.state.inserts.length,0);
});
