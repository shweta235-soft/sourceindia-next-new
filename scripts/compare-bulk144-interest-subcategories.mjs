/** GET-only Express-vs-Next comparison: no writes, uploads or deletes. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Could not load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const oldBase=`http://127.0.0.1:${server.address().port}`,newBase=process.env.BULK144_URL||'http://localhost:3000',prefix='/v2/api/interest_sub_categories';
const cases=[prefix,prefix+'/count',prefix+'/count_relation',prefix+'/server-side?page=1&limit=10&sortBy=id&sort=DESC'];
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
let match=0,diff=0,error=0;
try{
 const data=await fetch(oldBase+prefix,{signal:AbortSignal.timeout(20000)}).then(r=>r.json()).catch(()=>[]);
 if(Array.isArray(data)&&data.length&&Number.isSafeInteger(Number(data[0].id))){cases.push(prefix+'/'+data[0].id);if(Number.isSafeInteger(Number(data[0].interest_category_id)))cases.push(prefix+'/category/'+data[0].interest_category_id);}
 for(const path of cases){try{const [left,right]=await Promise.all([fetch(oldBase+path,{signal:AbortSignal.timeout(30000)}),fetch(newBase+path,{signal:AbortSignal.timeout(30000)})]);const [a,b]=await Promise.all([left.json(),right.json()]);if(left.status===right.status&&JSON.stringify(canon(a))===JSON.stringify(canon(b))){match++;console.log('MATCH',path,left.status);}else{diff++;console.log('DIFF',path,`Express=${left.status}`,`Next=${right.status}`);const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);for(const key of [...keys].slice(0,20))if(JSON.stringify(canon(a?.[key]))!==JSON.stringify(canon(b?.[key])))console.log(' FIELD',key,'Express',JSON.stringify(a?.[key])?.slice(0,500),'Next',JSON.stringify(b?.[key])?.slice(0,500));}}catch(e){error++;console.log('ERROR',path,e.cause?.code||e.code||e.name);}}
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(`BULK144 GET PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);
console.log('Authorized write parity deferred to final combined testing.');if(diff||error)process.exitCode=1;
