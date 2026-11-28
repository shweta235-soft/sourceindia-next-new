/** GET-only Express vs Next parity. Never triggers writes or emails. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing');process.exit(1);}
const srv=createServer(app);await new Promise((done,fail)=>{srv.once('error',fail);srv.listen(0,'127.0.0.1',done);});const a=`http://127.0.0.1:${srv.address().port}`,b=process.env.BULK145_URL||'http://localhost:3000',pre='/v2/api/newsletters';
const cases=[pre,pre+'/count',pre+'/user_type',pre+'/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
let match=0,diff=0,error=0;
try{const list=await fetch(a+pre,{signal:AbortSignal.timeout(30000)}).then(r=>r.json()).catch(()=>[]);if(Array.isArray(list)&&list.length&&Number.isSafeInteger(Number(list[0].id)))cases.push(pre+'/'+list[0].id);for(const path of cases)try{const [old,newer]=await Promise.all([fetch(a+path,{signal:AbortSignal.timeout(30000)}),fetch(b+path,{signal:AbortSignal.timeout(30000)})]);const [left,right]=await Promise.all([old.json(),newer.json()]);if(old.status===newer.status&&JSON.stringify(canon(left))===JSON.stringify(canon(right))){match++;console.log('MATCH',path,old.status);}else{diff++;console.log('DIFF',path,`Express=${old.status}`,`Next=${newer.status}`);const keys=new Set([...Object.keys(left||{}),...Object.keys(right||{})]);for(const key of [...keys].slice(0,15))if(JSON.stringify(canon(left?.[key]))!==JSON.stringify(canon(right?.[key])))console.log(' FIELD',key,'Express',JSON.stringify(left?.[key])?.slice(0,600),'Next',JSON.stringify(right?.[key])?.slice(0,600));}}catch(e){error++;console.log('ERROR',path,e.cause?.code||e.name);}}finally{await new Promise(done=>srv.close(done));}
console.log(`BULK145 GET PARITY: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);console.log('Authorized write parity deferred to final combined testing.');if(diff||error)process.exitCode=1;
