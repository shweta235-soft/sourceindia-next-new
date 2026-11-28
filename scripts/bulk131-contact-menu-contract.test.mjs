import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const menu=readFileSync('src/lib/localBulk128FrontMenu.ts','utf8');
const contact=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
const originalMenu=readFileSync('legacy/sourceindia-express/models/FrontMenu.js','utf8');
const originalContact=readFileSync('legacy/sourceindia-express/controllers/contactsController.js','utf8');
function fixture(){
 const state={inserts:[],commits:0,rollbacks:0};
 const conn={
   async beginTransaction(){},async commit(){state.commits++},async rollback(){state.rollbacks++},release(){},
   async execute(sql,args=[]){
      if(sql.startsWith('INSERT INTO front_menu')){state.inserts.push(args);return [{insertId:17}];}
      if(sql.startsWith('SELECT front_menu_id AS id'))return [[{id:17,parent_id:0,name:'QA menu',type:7,position:0}]];
      throw Error(`Unexpected SQL ${sql}`);
   }
 };
 const output=ts.transpileModule(menu,{fileName:'localBulk128FrontMenu.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const prior={...process.env};
 Object.assign(process.env,{NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'bulk131_qa_test',SOURCEINDIA_FRONT_MENU_WRITES_ENABLED:'1',SOURCEINDIA_FRONT_MENU_QA_DB_NAME:'bulk131_qa_test',SOURCEINDIA_FRONT_MENU_QA_TOKEN:'bulk131-menu-test-token-longer-than-32chars'});
 vm.runInNewContext(output,{module,exports:module.exports,require:(name)=>name==='@/lib/localAccountDatabase'?{localAccountDatabase:()=>({getConnection:async()=>conn})}:require(name),process,Buffer,Response,Request,URL,URLSearchParams,console,Date,Set,Map,Promise,Error,Number,Object,Array,String,RegExp,Math});
 return {api:module.exports,state,restore:()=>{for(const k of Object.keys(process.env))if(!(k in prior))delete process.env[k];Object.assign(process.env,prior)}};
}
test('original FrontMenu model restricts type to integer but not enum 1 or 2',()=>{
 assert.match(originalMenu,/type:\s*\{\s*type:\s*DataTypes\.INTEGER/);
 assert.doesNotMatch(originalMenu,/validate:\s*\{\s*isIn/);
 assert.match(menu,/menuType===null\|\|visible===null/);
});
test('non-1/2 integer menu type can be inserted with Sequelize-equivalent defaults in guarded QA',async()=>{
 const f=fixture();
 try{
  const req=new Request('http://localhost:3000/v2/api/front_menu/',{method:'POST',headers:{authorization:'Bearer '+process.env.SOURCEINDIA_FRONT_MENU_QA_TOKEN,'content-type':'application/json'},body:JSON.stringify({name:'QA menu',link:'/qa',is_show:1,status:1,type:7})});
  const res=await f.api.createMenu(req);
  assert.equal(res.status,201);
  assert.equal(f.state.inserts.length,1);
  assert.equal(f.state.inserts[0][1],0); // parent_id
  assert.equal(f.state.inserts[0][6],7); // type
  assert.equal(f.state.inserts[0][7],0); // position
  assert.equal(f.state.commits,1);
 }finally{f.restore();}
});
test('Contact notification fallback subject matches legacy first and last name',()=>{
 assert.match(originalContact,/`New Contact from \$\{fname\} \$\{lname\}`/);
 assert.match(contact,/`New Contact from \$\{fields\.fname\} \$\{fields\.lname\}`/);
});
test('production Front Menu writes remain blocked',async()=>{
 const f=fixture();try{const res=f.api.frontMenuWriteGate(new Request('http://localhost:3000/v2/api/front_menu/',{headers:{authorization:'Bearer '+process.env.SOURCEINDIA_FRONT_MENU_QA_TOKEN}}),{...process.env,NODE_ENV:'production'});assert.equal(res.status,403);assert.equal(f.state.inserts.length,0)}finally{f.restore()}
});
