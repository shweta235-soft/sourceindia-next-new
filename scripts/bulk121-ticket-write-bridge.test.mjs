import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const folder='src/app/v2/api/tickets/';
const expected=[
 ['route.ts','POST'],['send-otp/route.ts','POST'],['verify-otp/route.ts','POST'],
 ['store-ticket/route.ts','POST'],['track-ticket/route.ts','POST'],
 ['store-support-ticket-reply/route.ts','POST'],['[id]/route.ts','PUT'],
 ['[id]/status/route.ts','PATCH'],['[id]/route.ts','DELETE'],
];
const original=readFileSync('legacy/sourceindia-express/routes/ticketRoutes.js','utf8');
test('All 9 original Express mutations retain exact Next method/path exports',()=>{
 assert.equal([...original.matchAll(/router\.(post|put|patch|delete)\(/g)].length,9);
 for(const [route,method] of expected){const path=folder+route;
  assert.ok(existsSync(path),path);
  assert.match(readFileSync(path,'utf8'),new RegExp(`export async function ${method}\\(`),path);
  assert.match(readFileSync(path,'utf8'),/nativeTicketWrite/,path);
 }
});
test('No accidental live write access without independent QA opt ins',()=>{
 const source=readFileSync('src/lib/localBulk121TicketWriteBridge.ts','utf8');
 assert.match(source,/process\.env\.NODE_ENV==='production'/);
 assert.match(source,/SOURCEINDIA_TICKET_LEGACY_WRITES_ENABLED/);
 assert.match(source,/SOURCEINDIA_LEGACY_COMPAT_WRITES/);
 assert.match(source,/return legacyExpressBridgeRequest\(request\)/);
 assert.match(source,/status:number/);
 assert.doesNotMatch(source,/\bINSERT\b|\bUPDATE\s+tickets\b|\bDELETE\s+FROM\b/);
});
test('All ticket write bridge route modules have valid TypeScript syntax',()=>{
 for(const route of [...new Set(expected.map(([name])=>folder+name)),'src/lib/localBulk121TicketWriteBridge.ts']){
  const run=spawnSync(process.execPath,['--experimental-strip-types','--check',route],{encoding:'utf8'});
  assert.equal(run.status,0,route+': '+run.stderr);
 }
});
test('Native mutation bridge denies production and default QA writes before touching the legacy DB',async()=>{
 const {createRequire}=await import('node:module');
 const {runInNewContext}=await import('node:vm');
 const ts=createRequire(import.meta.url)('typescript');
 const source=readFileSync('src/lib/localBulk121TicketWriteBridge.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const box={exports:{}};let forwarded=0;
 const env={NODE_ENV:'development'};
 runInNewContext(js,{module:box,exports:box.exports,URL,Response,Set,process:{env},require:()=>({legacyExpressBridgeRequest:async()=>{forwarded++;return Response.json({ok:true});}})});
 const request={url:'http://localhost:3000/v2/api/tickets/send-otp',method:'POST'};
 const blocked=await box.exports.guardedLegacyTicketWrite(request);
 assert.equal(blocked.status,403);assert.equal(forwarded,0);
 env.SOURCEINDIA_TICKET_LEGACY_WRITES_ENABLED='1';
 const stillBlocked=await box.exports.guardedLegacyTicketWrite(request);
 assert.equal(stillBlocked.status,403);assert.equal(forwarded,0);
 env.SOURCEINDIA_LEGACY_COMPAT_WRITES='1';
 env.NODE_ENV='production';
 const productionBlocked=await box.exports.guardedLegacyTicketWrite(request);
 assert.equal(productionBlocked.status,403);assert.equal(forwarded,0);
 env.NODE_ENV='development';
 const qa=await box.exports.guardedLegacyTicketWrite(request);
 assert.equal(qa.status,200);assert.equal(forwarded,1);
});
