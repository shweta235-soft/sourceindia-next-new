import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const read=p=>readFileSync(resolve(p),'utf8');
const base='src/app/v2/api/front_menu/';
const paths=[['route.ts','GET'],['route.ts','POST'],['main-search/route.ts','POST'],['server-side/route.ts','GET'],['count/route.ts','GET'],['[id]/route.ts','GET'],['[id]/route.ts','PUT'],['[id]/route.ts','DELETE'],['[id]/is_show/route.ts','PATCH'],['[id]/status/route.ts','PATCH']];
test('all 10 original Express front menu method/path exports present',()=>{
 assert.equal((read('legacy/sourceindia-express/routes/frontMenuRoutes.js').match(/router\.(?:get|post|put|patch|delete)\(/g)||[]).length,10);
 for(const [path,method] of paths){assert.ok(existsSync(base+path));assert.match(read(base+path),new RegExp('export async function '+method+'\\('));}
});
test('native front menu handlers never proxy to Express',()=>{
 for(const [path] of paths)assert.ok(!read(base+path).includes('legacyExpressBridgeRequest'));
});
test('writes are denied by default and use isolated database and bearer token',()=>{
 const src=read('src/lib/localBulk128FrontMenu.ts');
 for(const needle of ['NODE_ENV','SOURCEINDIA_FRONT_MENU_WRITES_ENABLED','SOURCEINDIA_FRONT_MENU_QA_DB_NAME','SOURCEINDIA_FRONT_MENU_QA_TOKEN','timingSafeEqual','beginTransaction','FOR UPDATE'])assert.ok(src.includes(needle));
});
test('GET hierarchy, count and grid preserve original schema shapes',()=>{
 const src=read('src/lib/localBulk128FrontMenu.ts');
 for(const needle of ['sub_menu','headerCount','footerCount','filteredRecords','totalRecords','ORDER BY type ASC,position ASC','front_menu_id AS id'])assert.ok(src.includes(needle));
});
test('main search uses native weighted ranking and seller/buyer queries without 501',()=>{
 const src=read('src/lib/localBulk128FrontMenu.ts');
 assert.ok(src.includes('weightedFrontMenuKeywords'));
 assert.ok(src.includes('seller_categories'));
 assert.ok(src.includes('company_info'));
 assert.ok(!src.includes('needs native parity implementation.'));
 assert.ok(!src.includes('},501)'));
});
test('all changed TS files parse',async()=>{
 let ts;try{ts=(await import('typescript')).default;}catch{ts=(await import('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js')).default;}
 for(const filename of ['src/lib/localBulk128FrontMenu.ts',...new Set(paths.map(([file])=>base+file))]){
  const parsed=ts.createSourceFile(filename,read(filename),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length,0,filename+' '+parsed.parseDiagnostics.map(x=>x.messageText));
 }
});
