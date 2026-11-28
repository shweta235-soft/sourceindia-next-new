/**
 * BULK119 — local, GET-only functional differential test (no writes).
 * Runs the ORIGINAL Express app (without server.js, DB sync or port 5000) on
 * an ephemeral 127.0.0.1 port and compares it to the native Next.js routes.
 * Output is only a summary, never DB records, tokens or passwords.
 * Requires npm run setup:legacy:compat, same .env.local DB, and npm run dev.
 */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('No local DB env configured; parity comparison cannot run.');process.exit(1);}
const legacyFile=resolve('legacy/sourceindia-express/compat-app.cjs');
const requireLegacy=createRequire(legacyFile);
let app;
try{app=requireLegacy(legacyFile);}catch(e){console.error('Legacy app dependencies not installed. Run npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);
await new Promise((resolvePromise,reject)=>{
 server.once('error',reject);
 server.listen(0,'127.0.0.1',resolvePromise);
});
const {port}=server.address();
const original=`http://127.0.0.1:${port}`;
const next=process.env.BULK119_URL||'http://localhost:3000';
const cases=[
 '/v2/api/faqs/',
 '/v2/api/faqs/count',
 '/v2/api/faqs/server-side?page=1&limit=2',
 '/v2/api/faqs/999999999999999',
 '/v2/api/seo_pages/',
 '/v2/api/seo_pages/count',
 '/v2/api/seo_pages/server-side?page=1&limit=2',
 '/v2/api/seo_pages/slug/nonexistent-bulk119-parity-slug',
 '/v2/api/seo_pages/999999999999999',
 '/v2/api/testimonials/',
 '/v2/api/testimonials/count',
 '/v2/api/testimonials/server-side?page=1&limit=2',
 '/v2/api/testimonials/999999999999999',
 '/v2/api/roles/',
 '/v2/api/roles/server-side?page=1&limit=2',
 '/v2/api/roles/999999999999999',
 '/v2/api/pages/999999999999999'
];
// Data-driven positive detail cases: compare real records when present, without printing values.
// Never modifies either database. The static 404 cases still run for empty tables.
for(const resource of ['faqs','seo_pages','testimonials','roles']){
 try{
  const r=await fetch(new URL(`/v2/api/${resource}/`,original),{signal:AbortSignal.timeout(15000)});
  if(!r.ok)continue;
  const body=await r.json();if(!Array.isArray(body)||!body.length)continue;
  const first=body.find(x=>Number.isSafeInteger(Number(x?.id))&&Number(x.id)>0);
  if(first)cases.push(`/v2/api/${resource}/${Number(first.id)}`);
  if(resource==='seo_pages'&&typeof first?.slug==='string'&&first.slug&&first.slug.length<200&&!first.slug.includes('/')){
   cases.push(`/v2/api/seo_pages/slug/${encodeURIComponent(first.slug)}`);
  }
 }catch{/* Static cases still validate routing and nonexistence. */}
}
const sortKeys=(x)=>Array.isArray(x)?x.map(sortKeys):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sortKeys(x[k])])):x;
const shape=(x)=>Array.isArray(x)?'array':x===null?'null':typeof x;
/** Field paths only (never data values), so users can share a parity failure
 * without exposing their database records, contacts, emails or secrets. */
const differenceFields=(left,right,limit=8)=>{
 const fields=[];
 const walk=(a,b,path,depth)=>{
  if(fields.length>=limit)return;
  if(Object.is(a,b))return;
  if(depth<7&&Array.isArray(a)&&Array.isArray(b)){
   if(a.length!==b.length)fields.push(`${path || '$'}.length`);
   for(let i=0;i<Math.min(a.length,b.length,5)&&fields.length<limit;i++)walk(a[i],b[i],`${path}[${i}]`,depth+1);
   return;
  }
  if(depth<7&&a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
   for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
    if(fields.length>=limit)break;
    if(!Object.hasOwn(a,k)||!Object.hasOwn(b,k))fields.push(`${path ? path+'.' : ''}${k} (missing)`);
    else walk(a[k],b[k],`${path ? path+'.' : ''}${k}`,depth+1);
   }
   return;
  }
  fields.push(path||'$');
 };
 walk(left,right,'',0);
 return fields;
};
/** Only date *categories* and relative differences are logged (not row values).
 * A zero-date/null discrepancy is distinguishable from timezone/precision drift.
 */
const dateCategory=(value)=>{
 if(value===null)return 'null';
 if(value===undefined)return 'missing';
 if(typeof value!=='string')return typeof value;
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value))return 'non-ISO-string';
 return Number.isFinite(Date.parse(value))?'valid-ISO':'invalid-ISO';
};
const dateDeltaTag=(a,b)=>{
 const ca=dateCategory(a),cb=dateCategory(b);
 if(ca!=='valid-ISO'||cb!=='valid-ISO')return `legacy:${ca}/native:${cb}`;
 const difference=Date.parse(b)-Date.parse(a);
 if(!Number.isFinite(difference))return 'unparseable';
 const abs=Math.abs(difference);
 return abs===0?'same-instant':abs%60000===0?`delta-minutes:${difference/60000}`:`delta-milliseconds:${difference}`;
};
const safeDateDiagnostic=(legacy,native)=>{
 const a=Array.isArray(legacy)?legacy:legacy?.data??legacy;
 const b=Array.isArray(native)?native:native?.data??native;
 const lists=Array.isArray(a)&&Array.isArray(b)?[a,b]:
  a&&b&&typeof a==='object'&&typeof b==='object'?[[a],[b]]:null;
 if(!lists)return '';
 const [left,right]=lists;
 return ['created_at','updated_at'].map(field=>{
  const tags=new Set();
  for(let i=0;i<Math.min(left.length,right.length,5);i++){
   if(Object.is(left[i]?.[field],right[i]?.[field]))continue;
   tags.add(dateDeltaTag(left[i]?.[field],right[i]?.[field]));
  }
  return tags.size?` ${field}_diagnostic=[${[...tags].join(',')}]`:'';
 }).join('');
};
let same=0,different=0,error=0;
try{
 for(const path of cases){
  try{
   const headers={accept:'application/json'};
   const [a,b]=await Promise.all([
    fetch(new URL(path,original),{method:'GET',headers,signal:AbortSignal.timeout(15000)}),
    fetch(new URL(path,next),{method:'GET',headers,redirect:'manual',signal:AbortSignal.timeout(15000)})
   ]);
   const [aRaw,bRaw]=await Promise.all([a.text(),b.text()]);
   let aJson,bJson;try{aJson=JSON.parse(aRaw);}catch{aJson=aRaw;}try{bJson=JSON.parse(bRaw);}catch{bJson=bRaw;}
   let equals=false;try{assert.deepStrictEqual(sortKeys(aJson),sortKeys(bJson));equals=true;}catch{}
   if(a.status===b.status&&equals){same++;console.log(`MATCH ${path} HTTP ${a.status}`);}
   else {different++;const faqDiag=safeDateDiagnostic(aJson,bJson);console.log(`DIFF ${path} legacy=${a.status}/${shape(aJson)} native=${b.status}/${shape(bJson)} body_equal=${equals} fields=${differenceFields(aJson,bJson).join(',')||'none'}${faqDiag}`);}
  }catch(e){error++;console.log(`ERROR ${path} ${e?.cause?.code||e?.name||'UNKNOWN'}`);}
 }
}finally{await new Promise(resolvePromise=>server.close(resolvePromise));}
console.log(`BULK119 EXPRESS-NEXT PARITY RESULTS: MATCH=${same} DIFF=${different} ERROR=${error} TOTAL=${cases.length}`);
console.log('Only listed GET routes compared. Never interpret this as parity for all 516 registrations.');
if(different||error)process.exitCode=1;
