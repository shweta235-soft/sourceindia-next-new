/** GET-only parity with Express. No authenticated writes, uploads, or deletes. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
const oldBase=`http://127.0.0.1:${server.address().port}`,newBase=process.env.BULK143_URL||'http://localhost:3000';
const base='/v2/api/interest_categories',paths=[base,base+'/count',base+'/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
let matches=0,diffs=0,errors=0;
try{
 const list=await fetch(oldBase+base,{signal:AbortSignal.timeout(15000)}).then(r=>r.json()).catch(()=>[]);
 if(Array.isArray(list)&&list.length&&Number.isSafeInteger(Number(list[0].id)))paths.push(base+'/'+list[0].id);
 for(const path of paths){try{const [a,b]=await Promise.all([fetch(oldBase+path,{signal:AbortSignal.timeout(15000)}),fetch(newBase+path,{signal:AbortSignal.timeout(15000)})]);const [left,right]=await Promise.all([a.json(),b.json()]);if(a.status===b.status&&JSON.stringify(canon(left))===JSON.stringify(canon(right))){matches++;console.log('MATCH',path,a.status);}else{diffs++;console.log('DIFF',path,`Express=${a.status}`,`Next=${b.status}`);const keys=new Set([...Object.keys(left||{}),...Object.keys(right||{})]);for(const key of [...keys].slice(0,30))if(JSON.stringify(canon(left?.[key]))!==JSON.stringify(canon(right?.[key])))console.log(' FIELD',key,'Express',JSON.stringify(left?.[key])?.slice(0,600),'Next',JSON.stringify(right?.[key])?.slice(0,600));}}catch(e){errors++;console.log('ERROR',path,e.cause?.code||e.code||e.name);}}
}finally{await new Promise(done=>server.close(done));}
console.log(`BULK143 GET PARITY RESULTS: MATCH=${matches} DIFF=${diffs} ERROR=${errors} TOTAL=${paths.length}`);
console.log('Authorized write parity deferred to final combined testing.');if(diffs||errors)process.exitCode=1;
