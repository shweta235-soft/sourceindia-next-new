/** Read-only POST main-search comparison: no records created or changed. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local')}catch{process.exitCode=1;throw Error('Cannot read .env.local')}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy)}catch{console.error('Run npm run setup:legacy:compat');process.exit(1)}
const server=createServer(app);await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
const original=`http://127.0.0.1:${server.address().port}`,next=process.env.BULK128_URL||'http://localhost:3000';
const cases=[
 ['product','electronic'],['product','switch'],['seller','india'],['buyer','india'],
 ['product','a'],['buyer','a'],['seller','a'],['other','electronic']
];
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;
const diffs=(a,b)=>{
 if(!Array.isArray(a)||!Array.isArray(b))return ['type'];
 const out=[];if(a.length!==b.length)out.push('length');
 for(let i=0;i<Math.min(a.length,b.length,6);i++){
  for(const k of new Set([...Object.keys(a[i]??{}),...Object.keys(b[i]??{})]))if(JSON.stringify(a[i]?.[k])!==JSON.stringify(b[i]?.[k]))out.push(`[${i}].${k}`);
 }return out.slice(0,15)
};
let match=0,diff=0,error=0;
try{for(const [type,q] of cases){
 const path=`/v2/api/front_menu/main-search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}`;
 try{const [a,b]=await Promise.all([fetch(original+path,{method:'POST',signal:AbortSignal.timeout(18000)}),fetch(next+path,{method:'POST',signal:AbortSignal.timeout(18000)})]);
  const [x,y]=await Promise.all([a.json(),b.json()]);
  if(a.status===b.status&&JSON.stringify(normalize(x))===JSON.stringify(normalize(y))){match++;console.log('MATCH POST',path,'HTTP',a.status)}
  else{diff++;console.log('DIFF POST',path,`legacy=${a.status} native=${b.status}`,`fields=${diffs(x,y).join(',')}`)}
 }catch(e){error++;console.log('ERROR POST',path,e.cause?.code||e.name||'FAILED')}
}}finally{await new Promise(ok=>server.close(ok))}
console.log(`BULK128 SEARCH PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);
console.log('Search-only, no write methods or side-effect parity tested.');if(diff||error)process.exitCode=1;
