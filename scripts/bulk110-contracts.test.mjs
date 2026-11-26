import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {bulk110Id,bulk110Flag,bulk110Only,bulk110Series,bulk110Trend,bulk110Totals,bulk110GroupSourcing} from '../src/lib/localBulk110Contracts.mjs';
const NOW=new Date('2026-11-26T00:00:00Z');
const root=process.cwd();
const paths=[
 'sellers/trends','sellers/chart','sellers/seller-categories','sellers/seller-subcategories',
 'sellers/seller-subcategories-by-user','sellers/with-messages','sellers/seller-message/[userId]',
 'sellers/designations','sellers/nature_business','buyers/chart','buyers/get-buyer-sourcing-interests'
];
test('11 original Seller/Buyer read-only GET route files have Node runtime, no writes',()=>{
 for(const route of paths){const file=join(root,'src/app/admin/api/local',route,'route.ts');assert.ok(existsSync(file),route);
  const text=readFileSync(file,'utf8');assert.match(text,/export const runtime='nodejs'/);assert.match(text,/export async function GET\(/);
  assert.doesNotMatch(text,/export async function (POST|PATCH|PUT|DELETE)\(/);
 }
});
test('Validation rejects unsafe identifiers and unexpected query parameters',()=>{
 for(const input of ['0','-1','1 OR 1=1','1.0','001','99999999999999999',''])assert.equal(bulk110Id(input),null,input);
 assert.equal(bulk110Id('321'),321);assert.equal(bulk110Flag('0'),0);assert.equal(bulk110Flag('1'),1);assert.equal(bulk110Flag('true'),undefined);
 assert.equal(bulk110Only(new URLSearchParams('user_id=1&user_id=2'),['user_id']),false);
 assert.equal(bulk110Only(new URLSearchParams('user_id=1&sql=DROP'),['user_id']),false);
});
test('Trend defaults are exactly 30 days, 12 months, five years',()=>{
 const p=new URLSearchParams();assert.equal(bulk110Series(p,'trends',NOW)?.keys.length,30);
 assert.equal(bulk110Series(new URLSearchParams('period=month'),'trends',NOW)?.keys.length,12);
 assert.equal(bulk110Series(new URLSearchParams('period=year'),'trends',NOW)?.keys.length,5);
});
test('Charts default to 30 days; reject unbounded, invalid and SQL injection ranges',()=>{
 assert.equal(bulk110Series(new URLSearchParams(),'chart',NOW)?.keys.length,30);
 for(const query of ['startDate=2023-01-01&endDate=2026-11-26','startDate=2026-02-30&endDate=2026-11-26','startDate=2026-11-26','startDate=2026-11-26&endDate=2026-11-25','type=SECRET','sortBy=1','startDate=2026-11-25%27&endDate=2026-11-26']){
  assert.equal(bulk110Series(new URLSearchParams(query),'chart',NOW),null,query);
 }
});
test('Explicit dates accepted for sensible bounded windows',()=>{
 const s=bulk110Series(new URLSearchParams('startDate=2026-11-24&endDate=2026-11-26&type=ALLACTIVE'),'chart',NOW);
 assert.deepEqual(s?.keys,['2026-11-24','2026-11-25','2026-11-26']);
 assert.equal(s?.fromSql,'2026-11-24 00:00:00');assert.equal(s?.endSql,'2026-11-27 00:00:00');
});
test('Charts backfill empty buckets with zero and numeric totals',()=>{
 const s=bulk110Series(new URLSearchParams('startDate=2026-11-24&endDate=2026-11-26'),'chart',NOW);
 const data=bulk110Totals('sellers',[{date:'2026-11-25',active:'3',inactive:1,notApproved:2,notCompleted:4,deleted:0}],s);
 assert.equal(data.length,3);assert.equal(data[0].Total,0);assert.equal(data[1].Total,10);assert.equal(data[2].Total,0);
 assert.equal(data[1].NotCompleted,4);
 const trend=bulk110Trend('sellers',[{date:'2026-11-25',active:3}],s);
 assert.equal(trend.active['2026-11-25'],3);assert.equal(trend.active['2026-11-24'],0);
});
test('Buyer sourcing grouping is stable, deduplicates IDs, never includes user secrets',()=>{
 const grouped=bulk110GroupSourcing([
 {item_category_id:4,category_name:'Tools',item_subcategory_id:5,subcategory_name:'Hand'},
 {item_category_id:4,category_name:'Tools',item_subcategory_id:5,subcategory_name:'Hand'},
 {item_category_id:4,category_name:'Tools',item_subcategory_id:null,subcategory_name:null},
 {item_category_id:9,category_name:'Steel',item_subcategory_id:1,subcategory_name:'Sheets'}
 ]);
 assert.deepEqual(grouped,[{category_id:4,category_name:'Tools',subcategories:[{id:5,name:'Hand'}]},{category_id:9,category_name:'Steel',subcategories:[{id:1,name:'Sheets'}]}]);
});
test('SQL code is read-only, authenticated before DB, bounded root-user chart scans',()=>{
 const file=readFileSync('src/lib/localBulk110Admin.ts','utf8');
 assert.ok(file.indexOf('readAdminSession(')<file.indexOf('localAccountDatabase('));
 assert.match(file,/FROM users WHERE is_seller=\?/);
 assert.match(file,/LIMIT 5000/);
 assert.doesNotMatch(file,/\b(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i);
 assert.doesNotMatch(file,/SELECT\s+\*/i);
});
