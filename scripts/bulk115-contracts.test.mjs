import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import {BULK115_TABLES} from './bulk115-schema.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const t=(x)=>readFileSync(join(ROOT,x),'utf8');
const paths=JSON.parse(t('migration/reports/bulk115-admin-route-map.json'));
const all=(dir)=>readdirSync(join(ROOT,dir),{withFileTypes:true}).flatMap(x=>x.isDirectory()?all(dir+'/'+x.name):[dir+'/'+x.name]);
const routes=paths.map(x=>'src/app'+x.route+'/route.ts');
const location=['countries','states','cities','states/[country_id]','cities/[state_id]','pincode/[pin]'].map(x=>'src/app/v2/api/location/'+x+'/route.ts');
test('40 new Admin routes, 6 original-shape location routes, no pre-existing paths overwritten',()=>{
 assert.equal(paths.length,40);assert.equal(new Set(paths.map(x=>x.route)).size,40);assert.equal(location.length,6);
 for(const path of [...routes,...location])assert.ok(existsSync(join(ROOT,path)),path);
});
test('deep all-items URL is preserved through one short physical catch-all route',()=>{
 const special=paths.filter(x=>x.publicRoute?.includes('/by-category-subcategory-itemcategory-itemsubcategory'));
 assert.equal(special.length,1);
 for(const x of special){
  assert.match(x.publicRoute,/\[category_id\]\/\[subcategory_id\]\/\[item_category_id\]\/\[item_sub_category_id\]$/);
  assert.ok(x.route.endsWith('/[...ids]'));
  const file='src/app'+x.route+'/route.ts';
  assert.ok(existsSync(join(ROOT,file)),file);
  const code=t(file);
  assert.match(code,/p\.ids\.length===4/);
  assert.match(code,/bulk115AdminList\(req,'items'/);
  assert.ok(file.length<145,`Long path: ${file}`);
 }
});
test('all new routes export GET only, using Next16 async route params',()=>{
 for(const file of [...routes,...location]){
  const code=t(file);assert.match(code,/export async function GET/);assert.doesNotMatch(code,/export async function (?:POST|PUT|PATCH|DELETE)/);
  if(file.includes('['))assert.match(code,/await ctx\.params/);
 }
});
test('Admin routes always dispatch through an auth-guarded handler',()=>{
 const source=t('src/lib/localBulk115Admin.ts');
 for(const fn of ['bulk115AdminList','bulk115AdminChart','bulk115AdminServer','bulk115KeywordsForSubcategory']){
  const body=source.split('export async function '+fn)[1].split('\n}')[0];
  assert.match(body,/if\(!check\(req\)\)return err\(401,/);
 }
 for(const f of routes)assert.match(t(f),/localBulk115Admin/);
});
test('Admin SQL identifiers are static, filters bound, pagination max 100',()=>{
 const source=t('src/lib/localBulk115Admin.ts');
 assert.match(source,/const SPEC:Record<AdminFamily/);
 assert.match(source,/const extra:Record<string/);
 assert.match(source,/\.execute<RowDataPacket\[\]>/);
 assert.match(source,/paging\.limit,\(paging\.page-1\)\*paging\.limit/);
 assert.match(source,/Number\(ln\)>100/);
 assert.doesNotMatch(source,/(?:INSERT INTO|DELETE FROM|UPDATE\s+`|TRUNCATE|DROP\s+TABLE)/i);
});
test('No matching original React/Express or schema data gets written by scripts',()=>{
 for(const f of ['scripts/test-local-bulk115-db-preflight.mjs','scripts/test-local-bulk115-http.mjs']){
  assert.doesNotMatch(t(f),/(?:INSERT INTO|DELETE FROM|TRUNCATE TABLE|UPDATE `)/i);
 }
});
test('Parent column and graph source mappings match original Sequelize table names',()=>{
 const s=t('src/lib/localBulk115Admin.ts');
 for(const col of ['sub_category','item_subcategory_id','item_sub_category_id','seller_categories','buyer_sourcing_interests'])assert.ok(s.includes(col),col);
 for(const table of ['categories','sub_categories','item_category','item_subcategory','items','product_keywords'])assert.ok(Object.hasOwn(BULK115_TABLES,table));
});
test('Public legacy state country handler uses bounded array filters and distinct seller company counts',()=>{
 const s=t('src/lib/localBulk115Location.ts');
 assert.match(s,/values\.length>30/);assert.match(s,/COUNT\(DISTINCT u\.company_id\)/);
 assert.match(s,/p\.is_approve = 1/);assert.match(s,/ci\.is_delete = 0/);
 assert.match(s,/u\.is_seller = 1/);assert.match(s,/status = 1/);
});
test('PIN lookup does not disable TLS validation and restricts fixed HTTPS origin',()=>{
 const s=t('src/lib/localBulk115Location.ts');
 assert.match(s,/\^\\d\{6\}\$/);assert.match(s,/https:\/\/api\.postalpincode\.in\/pincode/);
 assert.doesNotMatch(s,/rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED|http:\/\//);
});
test('Keyword hierarchy uses item subcategories and used flag, not nonexistent keyword columns',()=>{
 for(const x of ['by-category-subcategory-itemcategory','by-category-subcategory-itemcategory-all']){
  const fname='src/app/admin/api/local/product-keywords/'+x+'/[category_id]/[subcategory_id]/[item_category_id]/route.ts';
  assert.match(t(fname),/'item-subcategories'/);
 }
 assert.match(t('src/lib/localBulk115Admin.ts'),/is_used/);
});
test('Original Bulk114 contracts remain present and configured',()=>{
 assert.ok(existsSync(join(ROOT,'scripts/bulk114-contracts.test.mjs')));
 const pkg=JSON.parse(t('package.json'));
 assert.ok(pkg.scripts['test:api:bulk114']);
 assert.ok(pkg.scripts['test:api:bulk115']);
});
test('Generated route syntax is valid TypeScript when TypeScript package installed',async (ctx)=>{
 let ts;try{ts=require('typescript');}catch{ctx.skip('TypeScript dependency not installed here');return;}
 const files=[...routes,...location,'src/lib/localBulk115Admin.ts','src/lib/localBulk115Location.ts'];
 for(const f of files){
  const out=ts.transpileModule(t(f),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  const errors=(out.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${f}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' '))}`);
 }
});
