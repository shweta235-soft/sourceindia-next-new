import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {bulk111Id,bulk111Query,bulk111InterestBody,bulk111SourcingBody,bulk111InterestTree,bulk111ItemTree,bulk111MarkChecked} from '../src/lib/localBulk111Contracts.mjs';
import {BULK111_TABLES} from './bulk111-schema.mjs';
const root=process.cwd();
const reads=['buyer-interest','get-buyer-interest','get-itemtype','get-item-subcategory','get-products','get-seller-company'];
const writes=['store-buyer-interest','store-item-subcategory'];
test('All six GETs and two POST route files export only declared method and Node runtime',()=>{
 for(const [method,paths] of [['GET',reads],['POST',writes]])for(const name of paths){
  const file=join(root,'src/app/api/local/dashboard',name,'route.ts');assert.ok(existsSync(file),name);
  const src=readFileSync(file,'utf8');assert.match(src,/export const runtime='nodejs'/);
  assert.match(src,new RegExp('export async function '+method+'\\('));
  assert.doesNotMatch(src,new RegExp('export async function (?!'+method+')(GET|POST|PATCH|DELETE|PUT)\\('));
 }
});
test('Positive IDs use bounded integers; null/zero, SQL fragments and unsafe numbers fail',()=>{
 assert.equal(bulk111Id('1'),1);assert.equal(bulk111Id(2147483647),2147483647);
 for(const id of [null,undefined,'','0','00','-1','01','1.2','1 OR 1=1',2147483648,Infinity,{},true])assert.equal(bulk111Id(id),null,String(id));
});
test('No cross-account query, SQL injection, duplicate or unknown URL parameters',()=>{
 assert.deepEqual(bulk111Query(new URLSearchParams(),7),{userId:7});
 assert.deepEqual(bulk111Query(new URLSearchParams('userId=7'),7),{userId:7});
 assert.equal(bulk111Query(new URLSearchParams('userId=8'),7)?.forbidden,true);
 for(const query of ['sortBy=password','userId=7&userId=8','userId=1%20OR%201=1','categoryId=1'])assert.equal(bulk111Query(new URLSearchParams(query),7),null,query);
 assert.equal(bulk111Query(new URLSearchParams('categoryId=4'),7,['categoryId'])?.categoryId,4);
 assert.equal(bulk111Query(new URLSearchParams('userId=8&categoryId=4'),7,['categoryId'])?.forbidden,true);
 assert.equal(bulk111Query(new URLSearchParams('categoryId=0'),7,['categoryId']),null);
});
test('Buyer interest payload is self-only and rejects invalid category/subcategory IDs',()=>{
 const valid=bulk111InterestBody({userId:7,activity:{'3':[4,5],'9':[8]}},7);
 assert.deepEqual(valid?.pairs,[[3,4],[3,5],[9,8]]);
 for(const input of [{userId:8,activity:{3:[4]}},{userId:7,activity:{}},{userId:7,activity:{'3':[4,4]}},{userId:7,activity:{'3':['4 OR 1=1']}},{userId:7,activity:{'3':[0]}},{userId:7,activity:{'3':[]}},{userId:7,activity:{3:[4]},is_admin:true}])assert.equal(bulk111InterestBody(input,7),null);
});
test('Buyer sourcing payload allows add/remove/replace and forbids unbounded or foreign input',()=>{
 for(const action of ['add','remove','replace'])assert.equal(bulk111SourcingBody({userId:7,activity:{category_id:2,subcategory_ids:[3,4],action}},7)?.action,action);
 assert.equal(bulk111SourcingBody({userId:7,activity:{category_id:2,subcategory_ids:[3]}},7)?.action,'replace');
 for(const input of [{userId:8,activity:{category_id:2,subcategory_ids:[3]}},{userId:7,activity:{category_id:2,subcategory_ids:[]}},{userId:7,activity:{category_id:2,subcategory_ids:[3,3]}},{userId:7,activity:{category_id:2,subcategory_ids:[3],action:'DROP'}},{userId:7,activity:{category_id:2,subcategory_ids:[3],userId:8}}])assert.equal(bulk111SourcingBody(input,7),null);
});
test('Interest category/subcategory tree follows original React dashboard response shape',()=>{
 const tree=bulk111InterestTree([{id:3,name:'Trade'}],[{id:5,interest_category_id:3,name:'Electronics'},{id:6,interest_category_id:99,name:'Orphan'}],[{core_activity_id:3,activity_id:5}]);
 assert.equal(tree.subCategories['3'].length,1);assert.equal(tree.subCategories['99'],undefined);
 assert.deepEqual(tree.checked['3'],[5]);
});
test('Item hierarchy groups categories and attaches selected buyer sourcing counts',()=>{
 const tree=bulk111ItemTree([{id:1,name:'Group'}],[{id:2,name:'Subgroup',category:1}],[{id:3,name:'Item',subcategory_id:2}],[{item_category_id:3,count:'2'}]);
 assert.equal(tree.categories[0].groups[0].categories[0].count,2);
 assert.equal(bulk111ItemTree([],[],[],[]).categories.length,0);
});
test('Item subcategory checked array and count are deterministic',()=>{
 const x=bulk111MarkChecked([{id:2,name:'Part',checked:1},{id:3,name:'Other',checked:0}]);
 assert.equal(x.checkedCount,1);assert.equal(x.subcategories[0].checked,true);assert.equal(x.subcategories[1].checked,false);
});
test('No local dashboard GET route accepts untrusted arbitrary user ID',()=>{
 const src=readFileSync('src/lib/localBulk111Dashboard.ts','utf8');
 assert.match(src,/bulk111Query\(params,identity.id/);
 assert.match(src,/profileMatchesSession\(row,claims\)/);
 assert.match(src,/claims\.is_seller!==0/);
 assert.match(src,/bearerAuthorization\(/);
 assert.match(src,/verifyLocalAuthToken\(/);
 assert.doesNotMatch(src,/SELECT\s+\*/i);
});
test('Writes require opt-in, same-origin check, strict payload, transaction and rollback',()=>{
 const src=readFileSync('src/lib/localBulk111Dashboard.ts','utf8');
 assert.match(src,/LOCAL_BUYER_DASHBOARD_WRITES_ENABLED/);
 assert.ok(src.indexOf('if(!sameOrigin(req))')<src.indexOf("LOCAL_BUYER_DASHBOARD_WRITES_ENABLED"));
 assert.match(src,/beginTransaction\(/);assert.match(src,/rollback\(/);assert.match(src,/commit\(/);
 assert.match(src,/WHERE buyer_id=\?/);assert.match(src,/WHERE user_id=\?/);
 assert.doesNotMatch(src,/DROP\s+TABLE|TRUNCATE\s+TABLE|sendMail\(|nodemailer|fetch\('https?:/i);
});
test('Owner queries have bounded results and matching product/category predicates',()=>{
 const src=readFileSync('src/lib/localBulk111Dashboard.ts','utf8');
 assert.match(src,/ORDER BY p\.product_id DESC LIMIT 10/);
 assert.match(src,/b\.user_id=\? AND b\.item_category_id=p\.item_category_id AND b\.item_subcategory_id=p\.item_subcategory_id/);
 assert.match(src,/WHERE b\.user_id=\? AND p\.status=1/);
 assert.match(src,/LIMIT 5000/);
});
test('Schema preflight covers original models for every new dashboard source table',()=>{
 assert.equal(Object.keys(BULK111_TABLES).length,12);
 assert.deepEqual(BULK111_TABLES.buyerinterests.slice(0,3),['buyerinterest_id','uuid','buyer_id']);
 assert.ok(BULK111_TABLES.company_info.includes('company_logo'));
});
