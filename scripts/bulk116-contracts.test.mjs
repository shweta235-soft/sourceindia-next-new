import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {
 bulk116Id,bulk116Like,bulk116ProductList,bulk116CompanyList,
 bulk116CompanyProducts,bulk116Suggest,bulk116Page,
} from '../src/lib/localBulk116ProductsContracts.mjs';
const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const routes=['','all-products/','latest-home/','suggest/','filtered/','companies/','companies/[id]/','details/[id]/'];
const url=(p)=>'http://localhost:3000/v2/api/products'+p;
test('8 original public Express method+path exports exist and are GET only',()=>{
 for(const sub of routes){const file='src/app/v2/api/products/'+sub+'route.ts';assert.ok(existsSync(new URL(file,root)),file);
  const t=read(file);assert.match(t,/export async function GET/);assert.doesNotMatch(t,/export (?:async )?function (?:POST|PUT|PATCH|DELETE)/);
  assert.match(t,/localBulk116Products/);
  if(sub.includes('['))assert.match(t,/await ctx\.params/);
 }
});
test('public product list accepts the primary React homepage query',()=>{
 const v=bulk116ProductList(url('?category=33&is_delete=0&status=1&is_approve=1&is_front=1&limit=10&sort_by=newest'));
 assert.equal(v?.limit,10);assert.deepEqual(v.values,[33]);assert.match(v.where,/p\.category IN/);
});
test('reject public access to drafts, deleted or unapproved records',()=>{
 for(const query of ['is_approve=0','is_delete=1','status=0','is_front=0','is_approve=2'])assert.equal(bulk116ProductList(url('?'+query)),null);
});
test('pagination and sort bounds cannot bypass SQL limit',()=>{
 for(const query of ['page=0','limit=51','limit=-1','page=1001','sort_by=__proto__','page=1&page=2','limit=1.5'])assert.equal(bulk116ProductList(url('?'+query)),null);
 assert.deepEqual(bulk116Page(new URLSearchParams()),{page:1,limit:20,offset:0});
});
test('forbid SQL identifiers, invalid CSV, unknown keys, and duplicate parameters',()=>{
 for(const query of ['category=1,%20-3','category=1;DROP TABLE users','category=1,','company_id=-1','keyword_ids=2,2,abc','nonsense=1','sort_by=a_to_z&sort_by=newest'])assert.equal(bulk116ProductList(url('?'+query)),null);
 const arr=bulk116ProductList(url('?company_id=1,2,2&sort_by=a_to_z'));
 assert.ok(arr);assert.deepEqual(arr.values,[1,2]);assert.match(arr.where,/p\.company_id IN \(\?,\?\)/);
});
test('safe LIKE handling does not interpret arbitrary wildcard characters',()=>{
 assert.equal(bulk116Like('a%_!b'),'%a!%!_!!b%');
 const result=bulk116ProductList(url('?search=a%25_%21'));
 assert.ok(result);assert.equal(result.values[0],'%a!%!_!!%');
 assert.match(result.where,/p\.title LIKE \? ESCAPE '!'/);
});
test('company listing has public-only filters and bounded pagination',()=>{
 const x=bulk116CompanyList(url('/companies?is_delete=0&limit=11&page=1&sort_by=newest'));
 assert.equal(x?.limit,11);assert.match(x.where,/u[x2]?\.is_approve=1/);
 assert.equal(bulk116CompanyList(url('/companies?is_approve=2')),null);
 assert.equal(bulk116CompanyList(url('/companies?interest_sub_categories=1')),null);
});
test('company enquiry product titles preserve original invalid ID responses',()=>{
 const absent=bulk116CompanyProducts(url('/all-products'));
 assert.deepEqual(absent,{error:400,body:{success:false,message:'Company ID is required',data:[]}});
 assert.equal(bulk116CompanyProducts(url('/all-products?company_id=abc')).error,422);
 assert.deepEqual(bulk116CompanyProducts(url('/all-products?company_id=17')),{id:17});
});
test('product suggestion handles short queries and constrained hierarchy',()=>{
 const s=bulk116Suggest(url('/suggest?query=USB%20Cable&category=2&header_strict=true'));
 assert.deepEqual(s?.tokens,['usb','cable']);assert.equal(s?.ids.category,2);assert.equal(s?.strict,true);
 assert.equal(bulk116Suggest(url('/suggest?query=A%20the')).tokens.length,0);
 assert.equal(bulk116Suggest(url('/suggest?query=2&category=bad')),null);
 assert.equal(bulk116Suggest(url('/suggest?query='+('a'.repeat(101)))),null);
});
test('IDs must be positive safe integers',()=>{
 assert.equal(bulk116Id('0001'),null);assert.equal(bulk116Id('1'),1);assert.equal(bulk116Id('0'),null);
 assert.equal(bulk116Id('42949672960'),null);
});
test('original Express/React backend is not copied and no mutation handlers were created',()=>{
 const t=read('src/lib/localBulk116Products.ts');
 assert.doesNotMatch(t,/\b(?:INSERT INTO|UPDATE products|DELETE FROM|TRUNCATE|DROP TABLE)\b/i);
 assert.match(t,/is_approve=1/);assert.match(t,/is_delete=0/);assert.match(t,/LIMIT 200/);
 assert.ok(!routes.some(x=>x.includes('post')));
});
test('company and product detail SQL avoid login secrets',()=>{
 const t=read('src/lib/localBulk116Products.ts');
 assert.doesNotMatch(t,/\b(?:real_password|password_resets|access_token|refresh_token)\b/i);
 assert.match(t,/INNER JOIN users u ON/);assert.match(t,/review_ratings/);
 assert.match(t,/similar_products:similar/);
});
test('BULK115 original location routes still present; existing UI not rewritten',()=>{
 for(const name of ['countries','states','cities'])assert.ok(existsSync(new URL('src/app/v2/api/location/'+name+'/route.ts',root)));
 assert.ok(existsSync(new URL('src/components/home/Homepage.tsx',root)));
});
test('new TypeScript modules have valid syntax',t=>{
 let ts;try{ts=require('typescript');}catch{t.skip('typescript package unavailable');return;}
 for(const path of ['src/lib/localBulk116Products.ts',...routes.map(x=>'src/app/v2/api/products/'+x+'route.ts')]){
  const r=ts.transpileModule(read(path),{fileName:path,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  const errors=(r.diagnostics??[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,path+': '+errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; '));
 }
});

test('BULK116 type-fix regression: product fields survive RowDataPacket normalization and suggestions keep a typed title',()=>{
 const source=read('src/lib/localBulk116Products.ts');
 assert.match(source,/type PublicProduct = Record<string, unknown>/);
 assert.match(source,/function normalizeProduct\(row:RowDataPacket\):PublicProduct/);
 assert.match(source,/title:String\(x\.title\?\?''\)/);
 assert.match(source,/\.sort\(\(a,b\)=>/);
});


test('BULK116 trailing-slash regression: Next.js does not 308 the legacy /v2/api/products/ endpoint',()=>{
 const config=read('next.config.ts');
 assert.match(config,/skipTrailingSlashRedirect\s*:\s*true/);
 const handler=read('src/app/v2/api/products/route.ts');
 assert.match(handler,/export async function GET/);
 const http=read('scripts/test-local-bulk116-http.mjs');
 assert.match(http,/\/v2\/api\/products\/\?limit=2&is_front=1/);
 assert.match(http,/redirect:'manual'/);
});
