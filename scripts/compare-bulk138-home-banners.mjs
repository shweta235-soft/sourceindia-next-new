/** BULK138: GET-only parity; never sends writes or uploads. */
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
const native=process.env.BULK138_URL||'http://localhost:3000';
const cases=['/v2/api/home_banners','/v2/api/home_banners/count','/v2/api/home_banners/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
let match=0,diff=0,error=0;
try{
 const list=await fetch(source+'/v2/api/home_banners',{signal:AbortSignal.timeout(15000)}).then(r=>r.json()).catch(()=>[]);
 if(Array.isArray(list)&&list.length&&Number.isSafeInteger(Number(list[0].id)))cases.push('/v2/api/home_banners/'+list[0].id);
 for(const path of cases){
  try{const [old,newer]=await Promise.all([fetch(source+path,{signal:AbortSignal.timeout(15000)}),fetch(native+path,{signal:AbortSignal.timeout(15000)})]);
   const [a,b]=await Promise.all([old.json(),newer.json()]);
   if(old.status===newer.status&&JSON.stringify(canonical(a))===JSON.stringify(canonical(b))){match++;console.log('MATCH',path,old.status);}
   else{
  diff++;
  console.log('DIFF',path,`Express=${old.status}`,`Next=${newer.status}`);
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for(const key of keys){
    if(JSON.stringify(canonical(a?.[key])) !== JSON.stringify(canonical(b?.[key]))){
      console.log('  FIELD:',key);
      console.log('  Express:',JSON.stringify(a?.[key])?.slice(0,1500));
      console.log('  Next:',JSON.stringify(b?.[key])?.slice(0,1500));
    }
  }
}
  }catch(e){error++;console.log('ERROR',path,e.cause?.code||e.code||e.name);}
 }
}finally{await new Promise(done=>server.close(done));}
console.log(`BULK138 GET PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);
console.log('Writes, file uploads, and delete parity NOT tested.');
if(diff||error)process.exitCode=1;
