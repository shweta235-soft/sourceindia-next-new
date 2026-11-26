import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as contracts from '../src/lib/localBulk110Contracts.mjs';
// Module transpile uses the same TS module syntax, with all server dependencies
// replaced by in-memory stubs: never opens MySQL, modifies data or sends email.
const src=readFileSync('src/lib/localBulk110Admin.ts','utf8');
const generated=ts.transpileModule(src,{fileName:'localBulk110Admin.ts',reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
if(generated.diagnostics?.length)throw Error(generated.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));
const calls=[];
const db={execute:async (sql,args=[])=>{
 calls.push({sql,args});
 if(sql.includes('DATE_FORMAT('))return [[{date:'2026-11-25',active:'2',inactive:'1',notApproved:0,notCompleted:0,deleted:0}]];
 if(sql.includes('FROM categories'))return [[{id:1,name:'Components',slug:'components'}]];
 if(sql.includes('FROM sub_categories'))return [[{id:2,name:'Electronics',slug:'electronics',category_id:1}]];
 if(sql.includes('DISTINCT user_id'))return [[{user_id:3},{user_id:4}]];
 if(sql.includes('FROM seller_messages sm'))return [[{id:2,uuid:'x',user_id:3,message:'Follow up',created_at:null,updated_at:null,linked_user_id:3,fname:'A',lname:'B',email:'a@example.com',is_seller:1}]];
 if(sql.includes('FROM designations'))return [[{id:1,name:'Owner',status:1}]];
 if(sql.includes('FROM nature_businesses'))return [[{id:1,name:'Manufacturer',status:1}]];
 if(sql.includes('FROM buyer_sourcing_interests'))return [[{item_category_id:2,item_subcategory_id:7,category_name:'Category',subcategory_name:'Subcategory'}]];
 return [[]];
 }};
let sessionEnabled=true;
const modules={
 '@/lib/adminSession':{adminSessionCookie:'si_admin_session',readAdminSession:v=>(sessionEnabled&&v==='signed')?{id:'1'}:undefined},
 '@/lib/localAdminFaqAuth':{adminFaqResponse:(data,status=200)=>({status,data})},
 '@/lib/localAccountDatabase':{localAccountDatabase:()=>db},
 '@/lib/localBulk110Contracts.mjs':contracts,
};
const box={exports:{}};const context={module:box,exports:box.exports,require:(id)=>{
 if(!(id in modules))throw new Error('Unexpected dependency '+id);return modules[id];
},process:{env:{NODE_ENV:'test'}},URL,Number,String,Set,Object,Array,Map,RegExp};
vm.runInNewContext(generated.outputText,context,{filename:'compiledBulk110.js'});
const handle=box.exports.bulk110Handle;
function req(query='',authenticated=true){return {url:'http://localhost:3000/admin/api/local/test'+query,cookies:{get:()=>authenticated?{value:'signed'}:undefined}};}
async function ask(kind,operation,query='',id){return handle(req(query),kind,operation,id);}
test('Unauthenticated requests rejected before any database calls',async()=>{
 calls.length=0;const answer=await handle(req('',false),'sellers','chart');
 assert.equal(answer.status,401);assert.equal(calls.length,0);
});
test('Seller chart and trends use one grouped users-table SELECT and preserve shape',async()=>{
 calls.length=0;
 const chart=await ask('sellers','chart','?startDate=2026-11-25&endDate=2026-11-25');
 assert.equal(chart.status,200);assert.equal(chart.data.length,1);assert.equal(chart.data[0].Total,3);
 assert.equal(calls.length,1);assert.match(calls[0].sql,/FROM users WHERE is_seller=\?/);
 const trend=await ask('sellers','trends','?from=2026-11-25&to=2026-11-25');
 assert.equal(trend.status,200);assert.equal(trend.data.active['2026-11-25'],2);
 const all=await ask('sellers','chart','?startDate=2026-11-25&endDate=2026-11-25&type=ALLACTIVE');
 assert.equal(all.status,200);assert.equal(all.data[0].volume,3);
});
test('Buyer chart returns four original categories and never includes seller-only fields',async()=>{
 const result=await ask('buyers','chart','?startDate=2026-11-25&endDate=2026-11-25');
 assert.equal(result.status,200);assert.equal(result.data[0].NotCompleted,undefined);
});
test('Seller category and subcategory lookup enforces required IDs',async()=>{
 assert.equal((await ask('sellers','seller-categories')).data.success,true);
 assert.equal((await ask('sellers','seller-subcategories')).status,400);
 assert.equal((await ask('sellers','seller-subcategories','?category_id=1')).data[0].id,2);
 assert.equal((await ask('sellers','seller-subcategories-by-user','?category_id=1')).status,400);
 assert.equal((await ask('sellers','seller-subcategories-by-user','?category_id=1&user_id=9')).data[0].category_id,1);
});
test('Seller message list and detail expose only allowed user fields',async()=>{
 assert.deepEqual([...((await ask('sellers','with-messages')).data.user_ids)],[3,4]);
 assert.equal((await ask('sellers','seller-message','', 'x')).status,400);
 const d=(await ask('sellers','seller-message','', '3')).data;
 assert.equal(d.data.Users.id,3);
 assert.equal(d.data.Users.password,undefined);
});
test('Master reference endpoints support bounded, safe status filtering',async()=>{
 assert.equal((await ask('sellers','designations','?status=1')).data[0].name,'Owner');
 assert.equal((await ask('sellers','designations','?status=IN(1)')).status,400);
 assert.equal((await ask('sellers','nature_business')).data[0].name,'Manufacturer');
});
test('Buyer sourcing grouping keeps one category, validates positive user',async()=>{
 assert.equal((await ask('buyers','get-buyer-sourcing-interests')).status,400);
 const r=await ask('buyers','get-buyer-sourcing-interests','?user_id=8');
 assert.equal(r.status,200);assert.equal(r.data.data[0].subcategories[0].id,7);
});
test('Unknown query, SQL parameter and long chart ranges never query database',async()=>{
 calls.length=0;
 for(const [kind,op,path] of [
  ['sellers','chart','?startDate=2020-01-01&endDate=2026-11-26'],
  ['sellers','chart','?sortBy=password'],
  ['sellers','seller-categories','?drop=true'],
  ['buyers','get-buyer-sourcing-interests','?user_id=1%20OR%201=1'],
 ])assert.equal((await ask(kind,op,path)).status,400);
 assert.equal(calls.length,0);
});
