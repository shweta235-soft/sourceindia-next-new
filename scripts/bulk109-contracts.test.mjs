import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {BULK109_KINDS,BULK109_ACTIONS,bulk109Id,bulk109Page,bulk109Like,bulk109Text,bulk109Sort,bulk109Query,bulk109IndiaBounds} from '../src/lib/localBulk109Contracts.mjs';
import {BULK109_TABLES} from './bulk109-schema.mjs';
const root=resolve(import.meta.dirname,'..');
const code=readFileSync(join(root,'src/lib/localBulk109Admin.ts'),'utf8');
test('7 sources and 42 read-only route declarations have unique static dispatch',()=>{
 assert.equal(BULK109_KINDS.length,7);assert.equal(new Set(BULK109_KINDS).size,7);
 assert.equal(BULK109_ACTIONS.length,6);
 let num=0;
 for(const k of BULK109_KINDS)for(const [a,p] of [['list',''],['count','count'],['serverSide','server-side'],['filtered','filtered'],['summary','summary'],['detail','[id]']]){
  const file=join(root,'src/app/admin/api/local',k,p,'route.ts');assert.ok(existsSync(file),k+':'+a);
  const text=readFileSync(file,'utf8');
  assert.match(text,/export async function GET/);assert.match(text,/export const runtime='nodejs'/);
  assert.doesNotMatch(text,/export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(text,new RegExp(`bulk109Handle\\(req,'${k}','${a}'`));num++;
 }
 assert.equal(num,42);
});
test('unique model allowlists and SQL projections omit credentials, OTP and tokens',()=>{
 assert.equal(Object.keys(BULK109_TABLES).length,12);
 for(const [table,columns] of Object.entries(BULK109_TABLES)){
  assert.match(table,/^[a-z_]+$/);assert.ok(columns.length>=2);
  assert.equal(new Set(columns).size,columns.length,table);
 }
 assert.doesNotMatch(code,/(?:SELECT\s+\*|u\.password|u\.real_password|u\.otp|u\.email_token|u\.remember_token|t\.otp|t\.token)/i);
 assert.doesNotMatch(code,/\b(DROP|TRUNCATE|ALTER|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i);
 assert.match(code,/adminSessionCookie/);assert.match(code,/readAdminSession/);
});
test('ticket category never widens scope on missing admin role',()=>{
 assert.match(code,/if\(kind==='tickets'\)/);
 assert.match(code,/ticketCategory===null\)return send\(\{message:'Ticket category access not authorized.'/);
 assert.match(code,/a\.status=1/);assert.match(code,/a\.role,r\.ticket_category/);
 assert.match(code,/if\(Number\(rows\[0\]\.role\)===4\)return 0/);
 assert.match(code,/if\(ticketCategory>0\)/);
 assert.match(code,/if\(category===null\|\|category===undefined\|\|category==='\'\)return null/);
});
test('IDs and pagination reject invalid, huge or negative values',()=>{
 for(const x of ['0','-1','01','abc','1.3','1 OR 1=1','99999999999999999999999'])assert.equal(bulk109Id(x),null,x);
 assert.equal(bulk109Id('19'),19);
 for(const x of ['page=0','limit=0','limit=101','page=100001','page=100000&limit=100','page=1.5','page=-2','page=%20'])assert.equal(bulk109Page(new URLSearchParams(x)),null,x);
 assert.deepEqual(bulk109Page(new URLSearchParams('page=3&limit=15')),{page:3,limit:15,offset:30});
});
test('query parameters are strict and module-specific',()=>{
 assert.equal(bulk109Query(new URLSearchParams('search=John&getDeleted=true&country=1'),'sellers'),true);
 assert.equal(bulk109Query(new URLSearchParams('getDeleted=true'),'tickets'),false);
 assert.equal(bulk109Query(new URLSearchParams('category=1&status=0'),'tickets'),true);
 assert.equal(bulk109Query(new URLSearchParams('priority=high&sortBy=id'),'tickets'),true);
 assert.equal(bulk109Query(new URLSearchParams('user_id=2&company_id=3'),'buyer-enquiries'),true);
 for(const q of ['getDeleted=yes','category=0','sortBy=id&foo=bar','user_id=-7','search=a%00b','priority=a%0Ab'])assert.equal(bulk109Query(new URLSearchParams(q),'tickets'),false,q);
});
test('SQL wildcards escaped safely, search text bounded and control characters rejected',()=>{
 assert.equal(bulk109Like('A%!_'),'%A!%!!!_%');
 assert.equal(bulk109Text(' x ',10),'x');assert.equal(bulk109Text('a'.repeat(101),100),null);
 assert.equal(bulk109Text('hello\nworld'),null);
 assert.match(code,/LIKE \? ESCAPE '!'/);
});
test('static sort expressions cannot be user-controlled SQL',()=>{
 const allowed={id:'u.user_id',name:'u.fname'};
 assert.equal(bulk109Sort(new URLSearchParams('sortBy=name&sort=ASC'),allowed,'u.user_id'),' ORDER BY u.fname ASC, u.user_id DESC');
 for(const q of ['sortBy=password','sortBy=1;DROP','sort=RANDOM','sort=DESC;DELETE'])assert.equal(bulk109Sort(new URLSearchParams(q),allowed,'u.user_id'),null,q);
});
test('India local-day UTC bounds are stable on timezone boundary',()=>{
 assert.deepEqual(bulk109IndiaBounds(new Date('2026-11-25T18:31:00Z')),['2026-11-25 18:30:00','2026-11-26 18:30:00']);
 assert.deepEqual(bulk109IndiaBounds(new Date('2026-11-25T18:29:00Z')),['2026-11-24 18:30:00','2026-11-25 18:30:00']);
});
test('all 516 legacy routes retain static traceability and no parity assertions',()=>{
 const report=JSON.parse(readFileSync(join(root,'migration/reports/bulk109-endpoint-matrix.json')));
 assert.equal(report.rows.length,516);assert.equal(report.stats.legacy_rows,516);
 assert.equal(report.stats.parity,'NOT_VERIFIED');assert.ok(report.rows.every(x=>x.parity_verified===false));
 const work=JSON.parse(readFileSync(join(root,'migration/reports/full-api-migration-worklist.json')));
 assert.equal(work.rows.length,516);// The worklist is refreshed to the newest bulk while this test guards
 // the historical Bulk109 matrix. Later bulks may only add static candidates.
 assert.ok(work.counts.static_candidates>=report.stats.method_path_candidates);
});
test('Bulk109 server-side count optimization avoids redundant joined COUNT scans',()=>{
 assert.match(code,/const countRoot:Record<Kind,string>/);
 assert.match(code,/sellers:'users u',buyers:'users u',users:'users u'/);
 assert.match(code,/if\(condition\.where!==condition\.baseWhere\)/);
 assert.match(code,/bulk109CountPlan\(kind,false\)/);
 assert.match(code,/bulk109CountPlan\(kind,joinedSearch\)/);
 assert.match(code,/const joinedSearch=bulk109Search\(q\)!==''/);
});
