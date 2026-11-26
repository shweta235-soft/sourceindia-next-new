import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {bulk109UsersPageFirst,bulk109OrderByIds,bulk109Page,bulk109Sort,bulk109Query} from '../src/lib/localBulk109Contracts.mjs';
const root=resolve(import.meta.dirname,'..');
const source=readFileSync(join(root,'src/lib/localBulk109Admin.ts'),'utf8');

test('users list, filtered and server-side use bounded primary-key-first pagination when safe',()=>{
 for(const sortBy of ['id','fname','lname','email','mobile','status','is_approve','is_complete','created_at','updated_at','full_name']){
  assert.equal(bulk109UsersPageFirst('users',new URLSearchParams(`page=1&limit=1&sortBy=${sortBy}`)),true,sortBy);
 }
 assert.equal(bulk109UsersPageFirst('users',new URLSearchParams('page=1&limit=1')),true);
 for(const kind of ['sellers','buyers','companies','enquiries','tickets','buyer-enquiries']){
  assert.equal(bulk109UsersPageFirst(kind,new URLSearchParams('page=1&limit=1')),false,kind);
 }
 for(const q of ['search=A','sortBy=company_name','sortBy=country_name','sortBy=state_name','sortBy=city_name']){
  assert.equal(bulk109UsersPageFirst('users',new URLSearchParams(q)),false,q);
 }
 assert.match(source,/if\(bulk109UsersPageFirst\(kind,q\)\)/);
 assert.match(source,/stage='users-page-ids'/);
 assert.match(source,/SELECT u\.user_id AS id FROM users u\$\{condition\.where\}\$\{sort\} LIMIT \? OFFSET \?/);
 assert.match(source,/stage='users-page-enrich'/);
 assert.match(source,/WHERE u\.user_id IN \(\$\{placeholders\}\)/);
 assert.match(source,/rows=bulk109OrderByIds\(ids,enriched\)/);
});

test('safe primary-key pagination preserves user filter, validated sort and limit',()=>{
 const q=new URLSearchParams('page=3&limit=15&getDeleted=true&sortBy=created_at&sort=ASC&status=1&country=4');
 assert.equal(bulk109Query(q,'users'),true);
 assert.deepEqual(bulk109Page(q),{page:3,limit:15,offset:30});
 assert.equal(bulk109UsersPageFirst('users',q),true);
 assert.equal(bulk109Sort(q,{created_at:'u.created_at',id:'u.user_id'},'u.user_id'),' ORDER BY u.created_at ASC, u.user_id DESC');
 assert.match(source,/\[\.\.\.condition\.args,page!\.limit,page!\.offset\]/);
 assert.match(source,/ids\.map\(\(\)=>'\?'\)\.join\(','\)/);
});

test('enriched users are restored to page order without credentials or secret columns',()=>{
 const rows=[{id:5,fname:'B'},{id:8,fname:'A'},{id:3,fname:'C'}];
 const result=bulk109OrderByIds([8,5,3],rows);
 assert.deepEqual(result.map(r=>r.id),[8,5,3]);
 assert.deepEqual(rows.map(r=>r.id),[5,8,3],'original data not mutated');
 assert.deepEqual(bulk109OrderByIds([],[]),[]);
 // The full Users projection is reused for enrichment and is explicitly allowlisted.
 assert.match(source,/const userSelect=`u\.user_id AS id,u\.fname/);
 assert.match(source,/const \[enriched\]=await db\.execute<\(RowDataPacket & \{id:number\|string\}\)\[]>/);
 // mysql2 result explicitly declares the `id` alias used by the ordering helper.
 assert.doesNotMatch(source,/(?:SELECT\s+\*|u\.password|u\.real_password|u\.otp|u\.email_token|u\.remember_token)/i);
});

test('invalid user paging and search/sort inputs do not enter the optimized SQL path',()=>{
 for(const q of ['page=0','limit=101','sortBy=password','sort=RANDOM','search=a%0Ab']){
  const p=new URLSearchParams(q);
  const valid=bulk109Page(p)!==null&&bulk109Query(p,'users')&&bulk109Sort(p,{id:'u.user_id'},'u.user_id')!==null;
  assert.equal(valid,false,q);
 }
 assert.match(source,/if\(\['list','serverSide','filtered'\]\.includes\(action\)&&page===null\)/);
 assert.match(source,/if\(sort===null\)return send\(\{message:'Invalid sorting.'/);
});
