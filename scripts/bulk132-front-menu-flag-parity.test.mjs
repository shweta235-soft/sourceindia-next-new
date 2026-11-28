import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync('src/lib/localBulk128FrontMenu.ts','utf8');
const legacy=readFileSync('legacy/sourceindia-express/controllers/frontMenuController.js','utf8');
function harness(){
 const history={queries:[],commits:0,rollbacks:0};
 const conn={async beginTransaction(){},async commit(){history.commits++},async rollback(){history.rollbacks++},release(){},async execute(sql,args=[]){history.queries.push([sql,args]);if(sql.startsWith('SELECT'))return [[{id:14,parent_id:0,name:'Header',link:'/',is_show:1,status:1,type:1,position:0}]];return [{affectedRows:1}];}};
 const code=ts.transpileModule(source,{fileName:'localBulk128FrontMenu.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const env={...process.env,NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'bulk132_qa_test',SOURCEINDIA_FRONT_MENU_WRITES_ENABLED:'1',SOURCEINDIA_FRONT_MENU_QA_DB_NAME:'bulk132_qa_test',SOURCEINDIA_FRONT_MENU_QA_TOKEN:'bulk132-menu-test-token-longer-than-32chars'};
 const sandboxProcess={...process,env};
 vm.runInNewContext(code,{module,exports:module.exports,require:(name)=>name==='@/lib/localAccountDatabase'?{localAccountDatabase:()=>({getConnection:async()=>conn})}:require(name),process:sandboxProcess,Buffer,Response,Request,URL,URLSearchParams,console,Date,Set,Map,Promise,Error,Number,Object,Array,String,RegExp,Math});
 return {api:module.exports,history,env};
}
const request=(env,key,value,contentType='application/json')=>new Request('http://localhost:3000/v2/api/front_menu/14/'+key,{method:'PATCH',headers:{authorization:'Bearer '+env.SOURCEINDIA_FRONT_MENU_QA_TOKEN,'content-type':contentType},body:contentType==='application/json'?JSON.stringify({[key]:value}):`${key}=${encodeURIComponent(value)}`});
test('original Express only accepts numeric 0 and 1 for status and is_show',()=>{
 assert.match(legacy,/is_show !== 0 && is_show !== 1/);
 assert.match(legacy,/status !== 0 && status !== 1/);
});
test('string flags are denied with matching Express 400 and no DB writes',async()=>{
 const h=harness();for(const key of ['status','is_show'])for(const value of ['0','1']){
  const res=await h.api.updateMenuFlag(request(h.env,key,value), '14',key);
  assert.equal(res.status,400,`${key}=${value}`);
 }
 assert.equal(h.history.queries.length,0);
});
test('URL-encoded string flags are denied with matching Express 400',async()=>{
 const h=harness();for(const key of ['status','is_show']){
  const res=await h.api.updateMenuFlag(request(h.env,key,'1','application/x-www-form-urlencoded'),'14',key);
  assert.equal(res.status,400);
 }
 assert.equal(h.history.queries.length,0);
});
test('numeric JSON flags update with parameter binding and transaction',async()=>{
 const h=harness();for(const key of ['status','is_show'])for(const value of [0,1]){
  const res=await h.api.updateMenuFlag(request(h.env,key,value),'14',key);
  assert.equal(res.status,200,`${key}=${value}`);
 }
 assert.equal(h.history.commits,4);
 assert.equal(h.history.rollbacks,0);
 assert.equal(h.history.queries.filter(([sql])=>sql.startsWith('UPDATE')).length,4);
});
test('production remains default-deny even with QA token',async()=>{
 const h=harness();h.env.NODE_ENV='production';const res=await h.api.updateMenuFlag(request(h.env,'status',1),'14','status');assert.equal(res.status,403);assert.equal(h.history.queries.length,0);
});
