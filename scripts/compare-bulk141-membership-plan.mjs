/** BULK141: GET-only legacy-vs-Next parity, no writes. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
const source=`http://127.0.0.1:${server.address().port}`;
const native=process.env.BULK141_URL||'http://localhost:3000';
const paths=['/v2/api/membership_plan','/v2/api/membership_plan/count','/v2/api/membership_plan/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
let match=0,diff=0,error=0;
try{
 const list=await fetch(source+'/v2/api/membership_plan',{signal:AbortSignal.timeout(15000)}).then(r=>r.json()).catch(()=>[]);
 if(Array.isArray(list)&&list.length&&Number.isSafeInteger(Number(list[0].id)))paths.push('/v2/api/membership_plan/'+list[0].id);
 for(const p of paths){try{
  const [old,now]=await Promise.all([fetch(source+p,{signal:AbortSignal.timeout(15000)}),fetch(native+p,{signal:AbortSignal.timeout(15000)})]);
  const [a,b]=await Promise.all([old.json(),now.json()]);
  if(old.status===now.status&&JSON.stringify(canonical(a))===JSON.stringify(canonical(b))){match++;console.log('MATCH',p,old.status);}
  else{diff++;console.log('DIFF',p,`Express=${old.status}`,`Next=${now.status}`);console.log('Express sample',JSON.stringify(a).slice(0,900));console.log('Next sample',JSON.stringify(b).slice(0,900));}
 }catch(e){error++;console.log('ERROR',p,e.cause?.code||e.code||e.name);}}
}finally{await new Promise(done=>server.close(done));}
console.log(`BULK141 GET PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${paths.length}`);
console.log('Authorized write parity deferred to final combined testing.');
if(diff||error)process.exitCode=1;
