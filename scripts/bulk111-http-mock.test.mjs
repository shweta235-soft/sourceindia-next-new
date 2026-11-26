/** In-memory HTTP + SQL mock. No MySQL connection, uploads, email or real data mutations. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const generated=ts.transpileModule(readFileSync('src/lib/localBulk111Dashboard.ts','utf8'),{fileName:'localBulk111Dashboard.ts',reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
if(generated.diagnostics?.length)throw Error(generated.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));
const contracts=require('../src/lib/localBulk111Contracts.mjs'); // compatible with Node ESM bridge for test-only mocks
const calls=[];let role=0,existing=true,profileOK=true,writes=false,broken=false;
const sql=async(q,params=[])=>{
 calls.push({sql:q,params});
 if(broken)throw {code:'ER_NO_SUCH_COLUMN'};
 if(q.includes('SELECT user_id FROM users WHERE'))return [[{user_id:7}]];
 if(q.includes('FROM interest_categories'))return [[{id:1,name:'Interest',color:'red'}]];
 if(q.includes('FROM interest_sub_categories'))return [[{id:2,name:'Sub',interest_category_id:1}]];
 if(q.includes('FROM buyerinterests WHERE'))return [[{core_activity_id:1,activity_id:2}]];
 if(q.includes('FROM categories WHERE'))return [[{id:1,name:'Category'}]];
 if(q.includes('FROM sub_categories WHERE'))return [[{id:2,name:'Subgroup',category:1}]];
 if(q.includes('FROM item_category WHERE'))return [[{id:3,name:'Item',subcategory_id:2,category_id:1}]];
 if(q.includes('COUNT(DISTINCT item_subcategory_id)'))return [[{item_category_id:3,count:1}]];
 if(q.includes('FROM item_subcategory sc'))return [[{id:4,name:'Part',item_category_id:3,checked:1}]];
 if(q.includes('FROM products p LEFT JOIN'))return [[{id:11,slug:'product',title:'Product',image:'image.png'}]];
 if(q.includes('FROM (SELECT DISTINCT p.company_id'))return [[{id:5,organization_name:'Seller',logo:'logo.png'}]];
 if(q.includes('SELECT item_category_id FROM item_category'))return [[{item_category_id:3}]];
 if(q.includes('SELECT item_subcategory_id AS id FROM item_subcategory'))return [[{id:4}]];
 if(q.includes('SELECT interest_sub_category_id AS id FROM interest_sub_categories'))return [[{id:2}]];
 if(q.includes('SELECT item_subcategory_id AS id FROM buyer_sourcing_interests'))return [[{id:4}]];
 return [[]];
};
const connection={execute:sql,beginTransaction:async()=>{calls.push({sql:'BEGIN'});},commit:async()=>{calls.push({sql:'COMMIT'});},rollback:async()=>{calls.push({sql:'ROLLBACK'});},release:()=>{}};
const pool={execute:sql,getConnection:async()=>connection};
const modules={
 'node:crypto':require('node:crypto'),
 '@/lib/accountSession':{bearerAuthorization:v=>/^Bearer (buyer|seller)$/.test(v||'')?v:null},
 '@/lib/localAccountDatabase':{localAccountDatabase:()=>pool,localProfileById:async id=>profileOK?{id,email:'user@example.test',is_seller:role}:null},
 '@/lib/localAuthToken':{localAuthSecret:raw=>raw||null,verifyLocalAuthToken:token=>token==='buyer'?{id:7,email:'user@example.test',is_seller:0}:token==='seller'?{id:7,email:'user@example.test',is_seller:1}:null},
 '@/lib/localUserProfile':{profileMatchesSession:(row,claims)=>Boolean(row&&row.id===claims.id&&row.email===claims.email&&row.is_seller===claims.is_seller)},
 '@/lib/localBulk111Contracts.mjs':contracts,
};
const box={exports:{}};
const context={module:box,exports:box.exports,require:id=>{if(!(id in modules))throw Error('Unexpected import '+id);return modules[id];},process:{env:{LOCAL_AUTH_JWT_SECRET:'valid-test-secret',NODE_ENV:'development',LOCAL_BUYER_DASHBOARD_WRITES_ENABLED:'false'}},URL,Response,Request,Buffer,Number,Object,Map,Set,Error,Array,console};
vm.runInNewContext(generated.outputText,context,{filename:'compiledBulk111.js'});
const read=box.exports.bulk111Read,write=box.exports.bulk111Write;
function request(action,query='',token='buyer',method='GET',origin='http://localhost:3000',body){
 return new Request(`http://localhost:3000/api/local/dashboard/${action}${query}`,{method,headers:{host:'localhost:3000',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const json=async r=>({status:r.status,data:await r.json()});
test('Unauthenticated and seller accounts denied before any buyer SQL',async()=>{
 calls.length=0;
 assert.equal((await read(request('buyer-interest','',''),'buyer-interest')).status,401);
 assert.equal((await read(request('buyer-interest','','seller'),'buyer-interest')).status,403);
 assert.equal(calls.length,0);
});
test('Stale account rejected before buyer data query',async()=>{
 calls.length=0;profileOK=false;
 assert.equal((await read(request('get-buyer-interest'),'get-buyer-interest')).status,401);
 assert.equal(calls.length,0);profileOK=true;
});
test('Cross-account and unknown filters rejected without buyer SQL',async()=>{
 calls.length=0;
 assert.equal((await read(request('get-products','?userId=8'),'get-products')).status,403);
 assert.equal((await read(request('get-products','?sql=DROP'),'get-products')).status,400);
 assert.equal((await read(request('get-item-subcategory','?categoryId=1%20OR%201=1'),'get-item-subcategory')).status,400);
 assert.equal(calls.length,0);
});
test('Buyer interests read tree and checked selections',async()=>{
 const r=await json(await read(request('buyer-interest'),'buyer-interest'));
 assert.equal(r.status,200);assert.equal(r.data.categories[0].id,1);assert.equal(r.data.subCategories['1'][0].id,2);
 const checked=await json(await read(request('get-buyer-interest'),'get-buyer-interest'));
 assert.deepEqual(checked.data.checked['1'],[2]);
});
test('Buyer item hierarchy and selected subcategory include requested buyer ID',async()=>{
 const tree=await json(await read(request('get-itemtype'),'get-itemtype'));
 assert.equal(tree.status,200);assert.equal(tree.data.categories[0].groups[0].categories[0].count,1);
 const parts=await json(await read(request('get-item-subcategory','?categoryId=3'),'get-item-subcategory'));
 assert.equal(parts.data.checkedCount,1);
 assert.ok(calls.some(c=>c.sql.includes('FROM item_subcategory sc')&&c.params[0]===7&&c.params[1]===3));
});
test('Only matched approved product fields and companies returned, no private user columns',async()=>{
 const r=await json(await read(request('get-products'),'get-products'));
 assert.equal(r.status,200);assert.equal(r.data.data[0].file.file,'image.png');assert.equal(r.data.data[0].password,undefined);
 const c=await json(await read(request('get-seller-company'),'get-seller-company'));
 assert.equal(c.data.data[0].companyLogo.file,'logo.png');
});
test('Write requests require same origin and stay default-off without any business SQL',async()=>{
 calls.length=0;
 assert.equal((await write(request('store-buyer-interest','','buyer','POST','https://attacker.example',{userId:7,activity:{1:[2]}}),'store-buyer-interest')).status,403);
 assert.equal((await write(request('store-buyer-interest','','buyer','POST','http://localhost:3000',{userId:7,activity:{1:[2]}}),'store-buyer-interest')).status,503);
 assert.equal(calls.length,0);
});
test('Database error diagnostics do not leak SQL, PII, token or query content',async()=>{
 broken=true;const r=await json(await read(request('get-products'),'get-products'));broken=false;
 assert.equal(r.status,503);assert.equal(r.data.diagnostic.code,'ER_NO_SUCH_COLUMN');assert.equal(r.data.sql,undefined);
});

test('Isolated in-memory Buyer interest transaction commits only validated owner rows',async()=>{
 context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='true';calls.length=0;
 try{
  const r=await json(await write(request('store-buyer-interest','','buyer','POST','http://localhost:3000',{userId:7,activity:{1:[2]}}),'store-buyer-interest'));
  assert.equal(r.status,200);assert.equal(r.data.success,true);
  assert.ok(calls.some(c=>c.sql==='BEGIN'));
  assert.ok(calls.some(c=>c.sql==='DELETE FROM buyerinterests WHERE buyer_id=?'&&c.params[0]===7));
  assert.ok(calls.some(c=>c.sql.startsWith('INSERT INTO buyerinterests ')));
  assert.ok(calls.some(c=>c.sql==='COMMIT'));
  assert.equal(calls.some(c=>c.sql==='ROLLBACK'),false);
 }finally{context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='false';}
});
test('Isolated in-memory sourcing remove never touches other user IDs',async()=>{
 context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='true';calls.length=0;
 try{
  const r=await json(await write(request('store-item-subcategory','','buyer','POST','http://localhost:3000',{userId:7,activity:{category_id:3,subcategory_ids:[4],action:'remove'}}),'store-item-subcategory'));
  assert.equal(r.status,200);assert.ok(calls.some(c=>c.sql.includes('DELETE FROM buyer_sourcing_interests')&&c.params[0]===7&&c.params[1]===3));
  assert.ok(calls.some(c=>c.sql==='COMMIT'));
 }finally{context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='false';}
});
test('In-memory database failure rolls back Buyer transaction, no actual DB connection',async()=>{
 context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='true';calls.length=0;broken=true;
 try{
  const r=await json(await write(request('store-buyer-interest','','buyer','POST','http://localhost:3000',{userId:7,activity:{1:[2]}}),'store-buyer-interest'));
  assert.equal(r.status,503);
  assert.ok(calls.some(c=>c.sql==='ROLLBACK'));
  assert.ok(!calls.some(c=>c.sql==='COMMIT'));
 }finally{broken=false;context.process.env.LOCAL_BUYER_DASHBOARD_WRITES_ENABLED='false';}
});
