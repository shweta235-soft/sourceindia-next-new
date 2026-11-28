/** BULK142 GET-only legacy-vs-Next parity. No write operations. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
const original=`http://127.0.0.1:${server.address().port}`,native=process.env.BULK142_URL||'http://localhost:3000';
const paths=['/v2/api/emails','/v2/api/emails/count','/v2/api/emails/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(key=>[key,normalize(v[key])])):v;
let match=0,diff=0,error=0;
try{
 const list=await fetch(original+'/v2/api/emails',{signal:AbortSignal.timeout(15000)}).then(r=>r.json()).catch(()=>[]);
 if(Array.isArray(list)&&list.length&&Number.isSafeInteger(Number(list[0].id)))paths.push('/v2/api/emails/'+list[0].id);
 for(const p of paths){try{const [a,b]=await Promise.all([fetch(original+p,{signal:AbortSignal.timeout(15000)}),fetch(native+p,{signal:AbortSignal.timeout(15000)})]);const [x,y]=await Promise.all([a.json(),b.json()]);
  if(a.status===b.status&&JSON.stringify(normalize(x))===JSON.stringify(normalize(y))){match++;console.log('MATCH',p,a.status);}
  else {diff++;console.log('DIFF',p,`Express=${a.status}`,`Next=${b.status}`);const keys=new Set([...Object.keys(x??{}),...Object.keys(y??{})]);for(const key of keys){if(JSON.stringify(normalize(x?.[key]))!==JSON.stringify(normalize(y?.[key]))){console.log('  FIELD',key,'Express',JSON.stringify(x?.[key])?.slice(0,700),'Next',JSON.stringify(y?.[key])?.slice(0,700));}}}
 }catch(e){error++;console.log('ERROR',p,e.cause?.code||e.name);}}
}finally{await new Promise(ok=>server.close(ok));}
console.log(`BULK142 GET PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${paths.length}`);
console.log('Authorized write parity deferred to final combined testing.');if(diff||error)process.exitCode=1;
