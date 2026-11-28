/** BULK118 parity correction: exercise actual native handlers with an injected,
 * read-only mock DB. No network, records, schema or SQL writes are involved. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript'); // project devDependency, cross-platform (Windows and Linux)
const source = readFileSync('src/lib/localBulk118PublicReads.ts','utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
assert.equal(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0);

function loadWithFakeDB(){
 const queries=[];
 const db={execute:async(sql,args=[])=>{
  queries.push({sql,args});
  if(/SELECT COUNT\(\*\) AS total/i.test(sql))return [[{total:3}], []];
  if(/FROM faqcategories f\s+(?:WHERE|ORDER BY)/i.test(sql)){
   return [[{id:1,uuid:'test',name:'Public example',status:1,created_at:'2026-11-27T02:34:56.000Z',updated_at:'2026-11-27T02:34:56.000Z'}],[]];
  }
  return [[{id:2,name:'Public example',status:1,created_at:'2026-11-27T02:34:56.000Z',updated_at:'2026-11-27T02:34:56.000Z'}],[]];
 }};
 const exports={};
 const context={
  exports,require:(name)=>{
   if(name==='@/lib/localAccountDatabase')return{localAccountDatabase:()=>db};
   throw new Error(`unexpected module ${name}`);
  }, Response, URL, URLSearchParams,Date, Number, String, Math, console,
 };
 vm.runInNewContext(compiled.outputText,context,{filename:'localBulk118PublicReads.transpiled.cjs'});
 return {native:exports,queries};
}

test('all three admin grids default to DESC matching Express controllers',async()=>{
 for(const [kind,tableAlias,pk] of [['activity','a','activity_id'],['core','ca','core_activity_id'],['faq','f','faqcategory_id']]){
  const {native,queries}=loadWithFakeDB();
  const res=await native.getGrid(new Request('http://localhost:3000/?page=1&limit=2'),kind);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.deepEqual(Object.keys(body).sort(),['data','totalRecords','filteredRecords'].sort());
  assert.equal(queries.length,3);
  const select=queries.find(({sql})=>/ORDER BY/.test(sql));
  assert.ok(select,`${kind}: missing listing SQL`);
  assert.match(select.sql,new RegExp(`ORDER BY ${tableAlias}\\.${pk} DESC`));
  assert.deepEqual(Array.from(select.args.slice(-2)),[2,0]);
 }
});
test('explicit ASC sorting and bounded page remain available',async()=>{
 const {native,queries}=loadWithFakeDB();
 const res=await native.getGrid(new Request('http://localhost:3000/?page=2&limit=4&sort=ASC&sortBy=name'),'faq');
 assert.equal(res.status,200);
 const sql=queries.find(({sql})=>/ORDER BY/.test(sql));
 assert.match(sql.sql,/ORDER BY f.name ASC/);
 assert.deepEqual(Array.from(sql.args.slice(-2)),[4,4]);
});
test('FAQ list, FAQ detail and FAQ grid use UTC ISO dates matching Sequelize date serialization',async()=>{
 const {native,queries}=loadWithFakeDB();
 const list=await native.getFaqCategories(new Request('http://localhost:3000/v2/api/faqcategories/'));
 assert.equal(list.status,200);
 const records=await list.json();
 assert.ok(Array.isArray(records));
 assert.match(queries[0].sql,/DATE_FORMAT\(f\.created_at, '%Y-%m-%dT%H:%i:%s.%f'\)/);
 assert.match(queries[0].sql,/DATE_FORMAT\(DATE_ADD\(f\.updated_at, INTERVAL TIMESTAMPDIFF\(SECOND, NOW\(\), UTC_TIMESTAMP\(\)\) SECOND\), '%Y-%m-%dT%H:%i:%s.%f'\)/);
 assert.match(queries[0].sql,/YEAR\(f\.updated_at\)=0/);
 assert.match(queries[0].sql,/MONTH\(f\.updated_at\)=0/);
 assert.match(queries[0].sql,/DAYOFMONTH\(f\.updated_at\)=0/);
 assert.match(queries[0].sql,/AS created_at/);
 assert.match(queries[0].sql,/AS updated_at/);
 const grid=await native.getGrid(new Request('http://localhost:3000/v2/api/faqcategories/server-side'),'faq');
 assert.equal(grid.status,200);
 assert.ok(queries.some(({sql})=>/SELECT f\.faqcategory_id AS id,f\.name,f\.status,CASE WHEN/.test(sql)));
 const detail=await native.getFaqCategoryById('1');
 assert.equal(detail.status,200);
 assert.match(queries.at(-1).sql,/DATE_FORMAT\(f\.created_at/);
});
test('diagnostic prints field names only, never response values',()=>{
 const comparator=readFileSync('scripts/compare-bulk118-express-next.mjs','utf8');
 assert.match(comparator,/differenceFields\(aJson,bJson\)/);
 assert.match(comparator,/faqUpdatedAtSample\(aJson,bJson\)/);
 assert.match(comparator,/dateDeltaTag/);
 assert.match(comparator,/path\.includes\('\/faqcategories'\)/);
 assert.match(comparator,/path\.includes\('\/faq_categories'\)/);
 assert.match(comparator,/fields=\$\{/);
 assert.doesNotMatch(comparator,/JSON\.stringify\((?:aJson|bJson)\)/);
});

test('null and invalid FAQ updated_at values are preserved, not replaced with an ISO-looking zero date',async()=>{
 const {native,queries}=loadWithFakeDB();
 const response=await native.getFaqCategories(new Request('http://localhost:3000/v2/api/faqcategories/'));
 assert.equal(response.status,200);
 const sql=queries[0].sql;
 assert.match(sql,/CASE WHEN f\.updated_at IS NULL/);
 assert.match(sql,/THEN NULL ELSE CONCAT/);
 const result=await response.json();
 assert.ok(result.every(row => Object.hasOwn(row,'updated_at')));
});

// Real MySQL parity still needs running against the local database. The old
// version applied UTC formatting without undoing the session time-zone shift,
// which produced +330-minute updated_at differences on the user's machine.
test('FAQ updated_at uses dynamic MySQL session UTC offset, never fixed 330 minutes',async()=>{
 const {native,queries}=loadWithFakeDB();
 await native.getFaqCategories(new Request('http://localhost:3000/v2/api/faqcategories/?all=1'));
 await native.getFaqCategoryById('1');
 await native.getGrid(new Request('http://localhost:3000/v2/api/faqcategories/server-side?page=1&limit=2'),'faq');
 const sqls=queries.filter(({sql})=>/FROM faqcategories f/.test(sql) && /SELECT f\.faqcategory_id/.test(sql));
 assert.equal(sqls.length,3);
 for(const {sql} of sqls){
  assert.match(sql,/DATE_FORMAT\(DATE_ADD\(f\.updated_at, INTERVAL TIMESTAMPDIFF\(SECOND, NOW\(\), UTC_TIMESTAMP\(\)\) SECOND\)/);
  assert.match(sql,/DATE_FORMAT\(f\.created_at, '%Y-%m-%dT%H:%i:%s.%f'\)/);
  assert.doesNotMatch(sql,/DATE_ADD\(f\.created_at/);
  assert.doesNotMatch(sql,/INTERVAL\s+(?:330|19800)\s+(?:MINUTE|SECOND)/);
 }
});
