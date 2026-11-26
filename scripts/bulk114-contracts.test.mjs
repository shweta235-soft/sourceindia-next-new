import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {BULK114_FAMILIES,bulk114Id,bulk114Parse,bulk114Sql,bulk114SearchTerm} from '../src/lib/localBulk114Contracts.mjs';
const base='http://localhost:3000/api/local/catalog/';
const families=['subcategories','item-categories','item-subcategories','items','product-keywords'];
const routes=[
 'subcategories','item-categories','item-categories/count','item-categories/by-id/[id]',
 'item-categories/by-category/[categoryId]','item-categories/by-category-subcategory/[categoryId]/[subcategoryId]',
 'item-subcategories','item-subcategories/count','item-subcategories/by-id/[id]',
 'item-subcategories/by-item-category/[itemCategoryId]',
 'item-subcategories/by-hierarchy/[categoryId]/[subcategoryId]/[itemCategoryId]',
 'items','items/count','items/by-id/[id]','items/by-item-subcategory/[itemSubcategoryId]',
 'items/by-hierarchy/[categoryId]/[subcategoryId]/[itemCategoryId]/[itemSubcategoryId]',
 'product-keywords','product-keywords/count','product-keywords/by-id/[id]',
 'product-keywords/by-item-subcategory/[itemSubcategoryId]','taxonomy/summary','taxonomy/search'
];

test('Bulk114 provides 22 new real Next GET route exports with no mutation verbs',()=>{
 assert.equal(routes.length,22);
 for(const path of routes){
  const file=join(process.cwd(),'src/app/api/local/catalog',path,'route.ts');
  assert.ok(existsSync(file),path);
  const src=readFileSync(file,'utf8');
  assert.match(src,/export const runtime='nodejs'/);
  assert.match(src,/export async function GET\(/);
  assert.doesNotMatch(src,/export async function (POST|PUT|PATCH|DELETE)\(/);
 }
});
test('Bulk114 model coverage is exactly five active-only taxonomy resources',()=>{
 assert.deepEqual(Object.keys(BULK114_FAMILIES),families);
 for(const config of Object.values(BULK114_FAMILIES)){
  assert.match(config.where,/status=1/);
  assert.ok(config.select.includes(' AS id'));
  assert.ok(config.from.includes('categories')||config.from.includes('categories c'));
  assert.match(config.from,/is_delete=0/);
  assert.ok(!/SELECT\s+\*/i.test(config.select));
  assert.match(config.sort,/^[a-z_]+\.[a-z_]+$/i);
 }
});
test('Bulk114 integer IDs reject injection and invalid paths',()=>{
 assert.equal(bulk114Id('98765'),98765);
 for(const s of ['0','00','01','-1','1.2','1 or 1=1','9999999999',undefined,{},''])assert.equal(bulk114Id(s),null,String(s));
});
test('Unknown, duplicate, invalid, blank or huge page params are rejected',()=>{
 const invalid=['?page=0','?page=-2','?limit=0','?limit=51','?limit=999',
   '?page=1&page=2','?limit=5&limit=6','?unknown=yes','?categoryId=1%20OR%201=1','?subcategoryId=-3',
   '?q=x','?q=%25','?q='+ 'a'.repeat(80),'?page=1001'];
 for(const qs of invalid)assert.equal(bulk114Parse(base+'item-categories'+qs,'item-categories'),null,qs);
});
test('Fixed URL hierarchy IDs cannot be overwritten via query and are parameterized',()=>{
 const f={categoryId:'1',subcategoryId:'2',itemCategoryId:'3'};
 assert.equal(bulk114Parse(base+'items?categoryId=9','items',f),null);
 const parsed=bulk114Parse(base+'items?limit=10&page=2','items',f);
 assert.deepEqual(parsed?.filters,{categoryId:1,subcategoryId:2,itemCategoryId:3});
 const sql=bulk114Sql('items','list',parsed);
 assert.ok(sql.sql.includes('i.category_id=?'));
 assert.ok(sql.sql.includes('i.subcategory_id=?'));
 assert.ok(sql.sql.includes('i.item_category_id=?'));
 assert.deepEqual(sql.values,[1,2,3,10,10]);
 assert.ok(!sql.sql.includes('category_id=1'));
});
test('Queries cannot execute mutation statements or output password/token/secret columns',()=>{
 for(const family of families){
  const parsed=bulk114Parse(base+family+'?page=2&limit=5&q=Electronics',family);
  const list=bulk114Sql(family,'list',parsed);
  const count=bulk114Sql(family,'count',parsed);
  const detail=bulk114Sql(family,'detail',parsed,14);
  for(const query of [list,count,detail]){
   assert.ok(query);
   assert.match(query.sql,/^SELECT\s/i);
   assert.doesNotMatch(query.sql,/\b(UPDATE|DELETE|INSERT|TRUNCATE|DROP|ALTER|EXECUTE|SELECT\s+\*)\b/i);
   assert.doesNotMatch(query.sql,/\b(password|remember_token|otp|real_password|email_token)\b/i);
   assert.ok(query.values.includes('%Electronics%'));
  }
  assert.match(list.sql,/ORDER BY .* ASC LIMIT \? OFFSET \?$/);
  assert.match(count.sql,/COUNT\(\*\) AS total/);
  assert.match(detail.sql,/ LIMIT 1$/);
 }
});
test('Every SQL clause is bound, bounded, and excludes inactive parents',()=>{
 for(const family of families){
  const cfg=BULK114_FAMILIES[family];
  assert.match(cfg.from,/INNER JOIN/);
  assert.match(cfg.from,/status=1/);
  const parsed=bulk114Parse(base+family+'?limit=50&page=999',family);
  assert.ok(parsed);
  const {sql,values}=bulk114Sql(family,'list',parsed);
  assert.match(sql,/LIMIT \? OFFSET \?$/);
  assert.deepEqual(values.slice(-2),[50,49900]);
 }
});
test('Count and detail contracts reject missing IDs and count pagination',()=>{
 const url=base+'items';
 assert.equal(bulk114Sql('items','detail',bulk114Parse(url,'items'),null),null);
 assert.equal(bulk114Parse(url+'?limit=5','items',{},'count'),null);
 assert.ok(bulk114Sql('items','detail',bulk114Parse(url,'items',{},'detail'),5));
 assert.equal(bulk114Parse(url+'?q=abc','items',{id:'5'},'detail'),null);
});
test('Search is a minimum 3-character bounded, injection-safe Unicode term',()=>{
 assert.equal(bulk114SearchTerm(' circuit breaker '),'circuit breaker');
 assert.equal(bulk114SearchTerm('मशीन'),'मशीन');
 for(const val of ['a','%','abc%','x'.repeat(61),'a;DROP TABLE','abc\\def','  '])assert.equal(bulk114SearchTerm(val),null);
});
test('Taxonomy summary/search only call a read-only handler, never invoke external API or emails',()=>{
 const handler=readFileSync('src/lib/localBulk114Catalog.ts','utf8');
 assert.ok(handler.includes('localAccountDatabase'));
 assert.ok(handler.includes('db.execute<RowDataPacket[]>'));
 assert.doesNotMatch(handler,/\b(sendMail|nodemailer|fetch\(|beginTransaction\(|\.query\(["'`]DELETE|UPDATE\s+\w+\s+SET)\b/i);
 assert.match(handler,/Catalog lookup temporarily unavailable/);
 assert.match(handler,/Catalog search temporarily unavailable/);
});
