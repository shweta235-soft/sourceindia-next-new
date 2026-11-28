import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createContext,runInContext} from 'node:vm';
const req=createRequire(import.meta.url);
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
let ts;try{ts=req('typescript');}catch{const binary=execFileSync(process.platform==='win32'?'where':'which',['tsc'],{encoding:'utf8'}).split(/\r?\n/)[0];ts=req(resolve(dirname(realpathSync(binary)),'../lib/typescript.js'));}
const src=readFileSync('src/lib/localBulk124TicketCategories.ts','utf8');
const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},reportDiagnostics:true});
assert.equal(out.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
function moduleFor(pool){
 const exports={};const context=createContext({exports,require:(name)=>name==='@/lib/localAccountDatabase'?{localAccountDatabase:()=>pool}:req(name),Response,Buffer,URL,console,process,Number,Date,Set,Object,Promise});
 runInContext(out.outputText,context);return exports;
}
const jsonReq=(url,method,body,headers={})=>({url,headers:{get:k=>headers[k.toLowerCase()]??null},json:async()=>body,method});
const db=queries=>({execute:async(sql,args=[])=>{queries.push([sql,args]);if(sql.includes('COUNT('))return [[{total:2}]];if(sql.includes('LIMIT 1'))return [[{id:1,name:'Warranty',email:'qa@example.test',status:1}]];return [[{id:1,name:'Warranty',email:'qa@example.test',status:1}]];}});
test('list has getStatus virtual attribute and legacy array shape',async()=>{
 const queries=[];const m=moduleFor(db(queries));const res=await m.getCategories();assert.equal(res.status,200);assert.equal((await res.json())[0].getStatus,'Active');assert.match(queries[0][0],/ORDER BY ticket_category_id ASC/);
});
test('count returns legacy total and detail returns legacy 404',async()=>{
 const m=moduleFor({execute:async sql=>sql.includes('COUNT')?[[{total:12}]]:[[]]});
 assert.deepEqual(await (await m.getCategoryCount()).json(),{total:12});
 const res=await m.getCategoryDetail('999');assert.equal(res.status,404);assert.equal((await res.json()).message,'Ticket Category not found');
});
test('grid uses bound search, whitelisted SQL sorting and legacy data keys',async()=>{
 const calls=[];const m=moduleFor(db(calls));
 const res=await m.getCategoryGrid(jsonReq('http://localhost:3000/v2/api/ticket_categories/server-side?page=1&limit=2&search=abc&sortBy=not_a_column','GET'));
 assert.equal(res.status,200);const body=await res.json();assert.ok(Array.isArray(body.data));assert.equal(body.totalRecords,2);assert.equal(body.filteredRecords,2);
 assert.ok(calls.every(([sql])=>!sql.includes('not_a_column')));assert.ok(calls.some(([sql,args])=>sql.includes('LIMIT ? OFFSET ?')&&args.includes('%abc%')));
});
test('invalid pagination fails before database lookup',async()=>{
 const m=moduleFor({execute:()=>{throw Error('SHOULD_NOT_QUERY');}});
 for(const q of ['?page=-1','?limit=5000','?page=not-a-number'])assert.equal((await m.getCategoryGrid(jsonReq('http://localhost:3000/v2/api/ticket_categories/server-side'+q,'GET'))).status,400);
});
test('writes denied by default before DB and require production/QA database separation',async()=>{
 let touched=false;const m=moduleFor({getConnection:()=>{touched=true;throw Error('DB_USED');}});
 const r=jsonReq('http://localhost:3000/v2/api/ticket_categories/','POST',{});
 const denied=await m.createCategory(r);assert.equal(denied.status,403);assert.equal(touched,false);
 const deniedProduction=m.categoryWriteGate(r,{NODE_ENV:'production',SOURCEINDIA_TICKET_CATEGORY_WRITES_ENABLED:'1'});assert.equal(deniedProduction.status,403);
 const deniedRemote=m.categoryWriteGate(r,{NODE_ENV:'development',SOURCEINDIA_TICKET_CATEGORY_WRITES_ENABLED:'1',DB_HOST:'production.example.com',DB_NAME:'sourceindia_qa'});assert.equal(deniedRemote.status,403);
});
test('malformed identifier fails before any SELECT',async()=>{
 const m=moduleFor({execute:()=>{throw Error('SHOULD_NOT_QUERY');}});assert.equal((await m.getCategoryDetail('1 OR 1=1')).status,400);
});
