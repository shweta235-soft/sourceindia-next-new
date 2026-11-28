/** Safe tests: never issue requests to a live DB, write, email or upload API. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {legacyExpressBridgeRequest,isKnownSideEffectfulGet} from '../src/lib/localLegacyExpressBridge.ts';

const root=process.cwd();
const legacy=join(root,'legacy/sourceindia-express');
const requireLegacy=createRequire(join(legacy,'compat-app.cjs'));
const inventory=readFileSync(join(root,'migration/phase57-express-endpoints.csv'),'utf8').trim().split(/\r?\n/);

test('original 516 Express method/path registrations remain in source inventory',()=>{
 assert.equal(inventory.length-1,516);
 assert.ok(existsSync(join(legacy,'compat-app.cjs')));
 assert.ok(!existsSync(join(legacy,'server.js')),'dangerous startup server.js must never be shipped');
 assert.ok(!existsSync(join(legacy,'.env')),'original credentials must not be copied');
});
test('original 50 mounts from all 48 route modules are preserved',()=>{
 const mounts=JSON.parse(readFileSync(join(legacy,'ORIGINAL-MOUNTS.txt'),'utf8'));
 assert.equal(mounts.length,50);
 assert.equal(new Set(mounts.map(x=>x[1])).size,48);
 const source=readFileSync(join(legacy,'compat-app.cjs'),'utf8');
 assert.ok(!/\.sync\(|backfillMainProductKeywords|\.listen\(5000/.test(source));
 for(const [path,file] of mounts){
  assert.ok(source.includes(`app.use(${JSON.stringify(path)},require('./routes/${file}'))`)||
    (path==='/v2/api/admin'&&file==='adminEnquiriesRoutes'),
    `Missing legacy route mount ${path} ${file}`);
 }
});
test('Express runtime registers all 516 methods without DB sync or server start',()=>{
 const app=requireLegacy('./compat-app.cjs');
 const actual=app.router.stack.reduce((total,layer)=>total+(layer.handle?.stack||[]).reduce((sum,r)=>sum+(r.route?Object.keys(r.route.methods).length:0),0),0);
 assert.equal(actual,516);
});
test('every original Express method+full path matches the mounted router stack (including aliases)',()=>{
 const mounts=JSON.parse(readFileSync(join(legacy,'ORIGINAL-MOUNTS.txt'),'utf8'));
 const registered=[];
 for(const [mount,file] of mounts){
  const router=requireLegacy(`./routes/${file}`);
  for(const layer of router.stack){
   if(!layer.route)continue;
   for(const method of Object.keys(layer.route.methods))registered.push(`${method.toUpperCase()} ${mount}${layer.route.path}`);
  }
 }
 const inventoried=inventory.slice(1).map(line=>{
  const [method,path]=line.split(',');return `${method} ${path}`;
 });
 assert.deepEqual(registered.sort(),inventoried.sort());
});
test('original handlers are not all falsely reported as converted native Next routes',()=>{
 assert.ok(existsSync(join(root,'src/app/v2/api/[...legacy]/route.ts')));
 const contents=readFileSync(join(root,'src/app/v2/api/[...legacy]/route.ts'),'utf8');
 for(const method of ['GET','HEAD','OPTIONS','POST','PUT','PATCH','DELETE']){
  assert.match(contents,new RegExp(`export const ${method} = legacyExpressBridgeRequest;`));
 }
});
test('known mutation GETs are blocked unless explicitly enabled',()=>{
 for(const path of ['/v2/api/sellers/sendmail-cron','/v2/api/products/product-keyword-update',
   '/v2/api/signup/insert-from-company','/v2/api/users/insert-from-company',
   '/v2/api/seller_mail_histories/track-open/secret','/v2/api/tickets/support-ticket/track/5']){
  assert.equal(isKnownSideEffectfulGet(path),true,path);
 }
 assert.equal(isKnownSideEffectfulGet('/v2/api/products/filtered'),false);
});
test('write request denied by default without loading DB',async()=>{
 const previous=process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES;
 delete process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES;
 try{
  const result=await legacyExpressBridgeRequest(new Request('http://localhost:3000/v2/api/users/login',{method:'POST',body:'{}',headers:{'content-type':'application/json'}}));
  assert.equal(result.status,403);
 }finally{if(previous===undefined)delete process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES;else process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES=previous;}
});
test('side-effectful GET denied by default without DB',async()=>{
 const previous=process.env.SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET;
 delete process.env.SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET;
 try{
  const result=await legacyExpressBridgeRequest(new Request('http://localhost:3000/v2/api/sellers/sendmail-cron'));
  assert.equal(result.status,403);
 }finally{if(previous===undefined)delete process.env.SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET;else process.env.SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET=previous;}
});
test('production compatibility disabled by default',async()=>{
 const prevNode=process.env.NODE_ENV;const prevOpt=process.env.SOURCEINDIA_LEGACY_COMPAT_PRODUCTION;
 process.env.NODE_ENV='production';delete process.env.SOURCEINDIA_LEGACY_COMPAT_PRODUCTION;
 try{
  const result=await legacyExpressBridgeRequest(new Request('http://localhost:3000/v2/api/roles/'));
  assert.equal(result.status,503);
 }finally{if(prevNode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prevNode;
  if(prevOpt===undefined)delete process.env.SOURCEINDIA_LEGACY_COMPAT_PRODUCTION;else process.env.SOURCEINDIA_LEGACY_COMPAT_PRODUCTION=prevOpt;}
});
test('safe, nonexistent API returns Express 404 through bridge',async()=>{
 const result=await legacyExpressBridgeRequest(new Request('http://localhost:3000/v2/api/no-such-module-bulk117'));
 assert.equal(result.status,404);
});
test('original /v2 health response returns through bridge without DB',async()=>{
 const result=await legacyExpressBridgeRequest(new Request('http://localhost:3000/v2/'));
 assert.equal(result.status,200);
 assert.match(await result.text(),/Node.js app is running under \/v2/);
});
