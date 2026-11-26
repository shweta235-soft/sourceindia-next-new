import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {bulk108EmailInput,bulk108NewsletterEdit,bulk108PositiveId,bulk108Clone,bulk108DeleteStatus,bulk108SelectedIds,bulk108Paging,bulk108Order,bulk108Search,bulk108Like} from '../src/lib/localBulk108Contracts.ts';
const root=resolve(import.meta.dirname,'..');
const source=name=>readFileSync(resolve(root,'src/lib',name),'utf8');
const content=source('localBulk108Content.ts'),reports=source('localBulk108Reports.ts');
const methods={
 'email-templates':{'route.ts':['GET','POST'],'count/route.ts':['GET'],'server-side/route.ts':['GET'],'clone/route.ts':['POST'],'[id]/route.ts':['GET','PUT','DELETE']},
 'newsletter-circulars':{'route.ts':['GET','POST'],'count/route.ts':['GET'],'server-side/route.ts':['GET'],'user_type/route.ts':['GET'],'[id]/route.ts':['GET','PUT','DELETE'],'[id]/images/route.ts':['POST'],'[id]/images/[imageId]/route.ts':['DELETE']},
 'registrations':{'route.ts':['GET'],'count/route.ts':['GET'],'server-side/route.ts':['GET'],'delete-selected/route.ts':['DELETE'],'[id]/route.ts':['GET','DELETE'],'[id]/delete-status/route.ts':['PATCH']},
 'newsletter-histories':{'count/route.ts':['GET'],'server-side/route.ts':['GET']},
 'user-activity':{'route.ts':['GET'],'count/route.ts':['GET'],'server-side/route.ts':['GET'],'user_id/[user_id]/route.ts':['GET']},
 'category-conflict-logs':{'server-side/route.ts':['GET']}
};
test('Email template creation requires original model nonnullable fields and accepts explicit 0 values',()=>{
 const good={title:'Hello',subject:'Subject',description:'Content',message:'<p>Body</p>',is_seller_direct:0,status:0};
 assert.deepEqual(bulk108EmailInput(good,true),good);
 assert.equal(bulk108EmailInput({...good,title:''},true),null);
 assert.equal(bulk108EmailInput({...good,message:undefined},true),null);
 assert.equal(bulk108EmailInput({...good,password:'foo'},true),null);
 assert.equal(bulk108EmailInput({...good,status:2},true),null);
 assert.equal(bulk108EmailInput({...good,is_seller_direct:'0'},true),null);
 assert.equal(bulk108EmailInput({...good,message:'x'.repeat(100001)},true),null);
});
test('Email update is partial and cannot mutate id, uuid, timestamps or arbitrary SQL columns',()=>{
 assert.deepEqual(bulk108EmailInput({subject:'  Updated '},false),{subject:'Updated'});
 for(const key of ['email_id','uuid','updated_at','is_delete','sql'])assert.equal(bulk108EmailInput({[key]:'x'},false),null);
 assert.equal(bulk108EmailInput({},false),null);
});
test('Newsletter update is independent from file upload and only allows four audited fields',()=>{
 assert.deepEqual(bulk108NewsletterEdit({title:' T ',user_type:4}),{title:'T',user_type:4});
 for(const data of [{attachment:'5'},{title:''},{user_type:0},{ip_address:'malicious'},{title:'A'.repeat(256)}])assert.equal(bulk108NewsletterEdit(data),null);
});
test('ID, clone, registration status and selected IDs validate bounds strictly',()=>{
 assert.equal(bulk108PositiveId('1'),1);
 for(const x of [0,-1,'0','01','1 OR 1=1','4294967296','',NaN,{},null])assert.equal(bulk108PositiveId(x),null,String(x));
 assert.equal(bulk108Clone({id:1}),1);
 assert.equal(bulk108Clone({id:0}),null);
 assert.equal(bulk108Clone({id:1,foo:1}),null);
 assert.equal(bulk108DeleteStatus({is_delete:0}),0);
 assert.equal(bulk108DeleteStatus({is_delete:1}),1);
 assert.equal(bulk108DeleteStatus({is_delete:'1'}),null);
 assert.deepEqual(bulk108SelectedIds({ids:[1,'2',3]}),[1,2,3]);
 assert.equal(bulk108SelectedIds({ids:[1,1]}),null);
 assert.equal(bulk108SelectedIds({ids:Array.from({length:51},(_,i)=>i+1)}),null);
});
test('Pagination, search and SQL sort whitelists reject injection or unbounded requests',()=>{
 const root='http://localhost:3000/admin/api/local/emails';
 assert.deepEqual(bulk108Paging(root+'?page=2&limit=20'),{page:2,limit:20,offset:20});
 assert.equal(bulk108Paging(root+'?limit=101'),null);
 assert.equal(bulk108Paging(root+'?page=-1'),null);
 assert.equal(bulk108Search(root+'?search='+'x'.repeat(101)),null);
 assert.equal(bulk108Order(root+'?sortBy=secret',{id:'e.email_id'}),null);
 assert.equal(bulk108Order(root+'?sortBy=id&sort=DROP',{id:'e.email_id'}),null);
 assert.equal(bulk108Order(root+'?sortBy=id&sort=ASC',{id:'e.email_id'}),' ORDER BY e.email_id ASC');
 assert.equal(bulk108Like('100%_\\'),'%100\\%\\_\\\\%');
});
test('All 26 audited route files export exactly documented methods and Node runtime',()=>{
 let checked=0,exports=0;
 for(const [name,files] of Object.entries(methods))for(const [path,expected] of Object.entries(files)){
  const f=resolve(root,'src/app/admin/api/local',name,path);
  assert.ok(existsSync(f),f);
  const s=readFileSync(f,'utf8');
  const actual=[...s.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\(/g)].map(x=>x[1]);
  assert.deepEqual(actual.sort(),expected.slice().sort(),f);
  assert.match(s,/export const runtime='nodejs';/);
  checked++;exports+=expected.length;
 }
 assert.equal(checked,25);assert.equal(exports,32);
});
test('No direct physical DELETE, schema changes, file deletion or email sending in new modules',()=>{
 for(const s of [content,reports]){
  assert.doesNotMatch(s,/\b(?:DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\b/i);
  assert.doesNotMatch(s,/sendMail\(|unlinkSync\(|writeFileSync\(|fetch\(/);
 }
 assert.match(content,/LOCAL_ADMIN_BULK108_WRITES_ENABLED==='true'/);
 assert.match(content,/Physical delete blocked/);
 assert.match(content,/multipart file upload/);
});
test('Auth before DB, origin and writes flag before mutation; reports Admin-protected',()=>{
 const write=content.slice(content.indexOf('async function write('),content.indexOf('export async function bulk108ContentHandle('));
 const handler=content.slice(content.indexOf('export async function bulk108ContentHandle('));
 const auth=handler.indexOf('if(!authorizedAdminFaq(req))');
 const db=handler.indexOf('const db=localAccountDatabase()');
 const origin=write.indexOf('if(!adminFaqSameOrigin(req))');
 const flag=write.indexOf('if(!allowWrite())');
 assert.ok(auth>=0&&auth<handler.indexOf('return write(')&&auth<db);
 assert.ok(origin>=0&&origin<flag&&flag<write.indexOf('const db=localAccountDatabase()'));
 assert.ok(flag<write.indexOf('db.execute<ResultSetHeader>'));
 assert.ok(reports.includes('if(!authorizedAdminFaq(req))'));
});
test('Bulk108 traceability includes all original 516 registrations and never asserts parity',()=>{
 const data=JSON.parse(readFileSync(resolve(root,'migration/reports/bulk108-endpoint-matrix.json'),'utf8'));
 assert.equal(data.rows.length,516);
 assert.equal(data.stats.legacy_rows,516);
 assert.equal(data.stats.parity,'NOT_VERIFIED');
 assert.ok(data.rows.every(x=>x.parity_verified===false));
 assert.ok(data.rows.some(x=>x.legacy_route_file==='newsletterHistoriesRoutes.js'&&x.mapping_status==='STATIC_ROUTE_SHAPE_CANDIDATE'));
});
