import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const prior={...process.env};
Object.assign(process.env,{
 NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_NAME:'sourceindia_bulk130_qa_test',
 SOURCEINDIA_CONTACT_WRITES_ENABLED:'1',SOURCEINDIA_CONTACT_QA_DB_NAME:'sourceindia_bulk130_qa_test',
 SOURCEINDIA_CONTACT_QA_TOKEN:'bulk130-contact-test-token-more-than-32-chars'
});
after(()=>{for(const key of Object.keys(process.env))if(!(key in prior))delete process.env[key];Object.assign(process.env,prior);});
function fixture(){
 const state={rows:new Map([[1,{id:1,contact_id:1,is_delete:0}],[2,{id:2,contact_id:2,is_delete:0}],[3,{id:3,contact_id:3,is_delete:1}]]),commits:0,rollbacks:0};
 let snapshot;
 const conn={
  async beginTransaction(){snapshot=new Map([...state.rows].map(([k,v])=>[k,{...v}]));},
  async commit(){state.commits++;},
  async rollback(){state.rollbacks++;state.rows=new Map([...snapshot].map(([k,v])=>[k,{...v}]));},
  release(){},
  async execute(sql,args=[]){
   if(sql.startsWith('SELECT contact_id FROM contacts WHERE contact_id=?'))return [[state.rows.get(args[0])].filter(Boolean)];
   if(sql.startsWith('DELETE FROM contacts')){state.rows.delete(args[0]);return [{affectedRows:1}];}
   if(sql.startsWith('UPDATE contacts SET is_delete=?')){state.rows.get(args[1]).is_delete=args[0];return [{affectedRows:1}];}
   if(sql.startsWith('SELECT contact_id AS id'))return [[state.rows.get(args[0])].filter(Boolean)];
   throw Error('Unexpected execute '+sql);
  },
  async query(sql,args=[]){
   if(sql.startsWith('SELECT contact_id FROM contacts WHERE contact_id IN'))return [[...new Set(args)].map(i=>state.rows.get(i)).filter(r=>r&&r.is_delete===0)];
   if(sql.startsWith('UPDATE contacts SET is_delete=1')){for(const id of args)if(state.rows.has(id))state.rows.get(id).is_delete=1;return [{affectedRows:args.length}];}
   throw Error('Unexpected query '+sql);
  }
 };
 const source=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
 const compiled=ts.transpileModule(source,{fileName:'localBulk127Contacts.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,require:(id)=>id==='@/lib/localAccountDatabase'?{localAccountDatabase:()=>({getConnection:async()=>conn})}:require(id),process,Buffer,Response,Request,URL,URLSearchParams,console,Date,Set,Map,Promise,Error,Number,Object,Array,String,RegExp,Math});
 return {state,api:module.exports};
}
function req(method,body){return new Request('http://localhost:3000/v2/api/contacts/',{method,headers:{authorization:'Bearer '+process.env.SOURCEINDIA_CONTACT_QA_TOKEN,'content-type':'application/json'},body:JSON.stringify(body)});}
test('contact DELETE destroys only the selected record and commits once',async()=>{
 const {state,api}=fixture();const r=await api.deleteContact(req('DELETE',{}),'1');
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{message:'Contact deleted successfully'});
 assert.equal(state.rows.has(1),false);assert.equal(state.rows.has(2),true);assert.equal(state.commits,1);
});
test('contact bulk DELETE soft deletes valid active IDs and leaves others untouched',async()=>{
 const {state,api}=fixture();const r=await api.deleteContactSelection(req('DELETE',{ids:[1,2]}));
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{message:'2 contacts marked as deleted.'});
 assert.equal(state.rows.get(1).is_delete,1);assert.equal(state.rows.get(2).is_delete,1);assert.equal(state.commits,1);
});
test('contact delete_status follows original 0/1 validation and returns updated record',async()=>{
 const {state,api}=fixture();const r=await api.updateContactDeleteStatus(req('PATCH',{is_delete:1}),'1');
 assert.equal(r.status,200);const result=await r.json();assert.equal(result.message,'Contacts is removed');assert.equal(result.contacts.is_delete,1);
 assert.equal(state.commits,1);
});
test('invalid bulk delete IDs are rejected before SQL',async()=>{
 const {state,api}=fixture();const r=await api.deleteContactSelection(req('DELETE',{ids:[1,'not-a-number']}));
 assert.equal(r.status,400);assert.equal(state.commits,0);assert.equal(state.rows.get(1).is_delete,0);
});
