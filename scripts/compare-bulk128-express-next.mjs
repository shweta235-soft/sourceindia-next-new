/** Read-only comparison against original Express on same local database. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot read .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Local DB configuration required.');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy Express setup missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
const origin=`http://127.0.0.1:${server.address().port}`,next=process.env.BULK128_URL||'http://localhost:3000';
const cases=['/v2/api/front_menu/','/v2/api/front_menu/count','/v2/api/front_menu/server-side?page=1&limit=2','/v2/api/front_menu/999999999999999'];
try{const res=await fetch(origin+'/v2/api/front_menu/',{signal:AbortSignal.timeout(15000)});if(res.ok){const menus=await res.json();const row=menus.find?.(x=>Number.isSafeInteger(Number(x.id))&&Number(x.id)>0);if(row)cases.push('/v2/api/front_menu/'+row.id);}}catch{}
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;
function diff(a,b,path='',out=[]){if(out.length>=8||Object.is(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){
 if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)out.push(path+'.length');for(let i=0;i<Math.min(a.length,b.length,3);i++)diff(a[i],b[i],path+'['+i+']',out);}else if(!Array.isArray(a)&&!Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(!(k in a)||!(k in b))out.push(path+'.'+k);else diff(a[k],b[k],path+'.'+k,out);}}else out.push(path);
 }else out.push(path);return out;}
let matches=0,differences=0,errors=0;
try{for(const path of cases){try{const [a,b]=await Promise.all([fetch(origin+path,{signal:AbortSignal.timeout(15000)}),fetch(next+path,{signal:AbortSignal.timeout(15000)})]);const [x,y]=await Promise.all([a.json(),b.json()]);if(a.status===b.status&&JSON.stringify(normalize(x))===JSON.stringify(normalize(y))){matches++;console.log('MATCH',path,'HTTP',a.status);}else{differences++;console.log('DIFF',path,'legacy='+a.status,'native='+b.status,'fields='+diff(x,y).join(','));}}catch(e){errors++;console.log('ERROR',path,e.cause?.code||e.code||e.name||'FAILED');}}}finally{await new Promise(ok=>server.close(ok));}
console.log(`BULK128 EXPRESS-NEXT GET PARITY RESULTS: MATCH=${matches} DIFF=${differences} ERROR=${errors} TOTAL=${cases.length}`);
console.log('Only listed GET routes; POST main-search and writes are not parity verified.');
if(differences||errors)process.exitCode=1;
