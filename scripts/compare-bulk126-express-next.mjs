/** Read-only original Express vs Next comparison. No records or secrets are printed. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Local DB credentials required.');process.exit(1);}
const legacyFile=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacyFile)(legacyFile);}catch{console.error('Legacy dependencies unavailable: run npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',ok);});
const original=`http://127.0.0.1:${server.address().port}`;
const next=process.env.BULK126_URL||'http://localhost:3000';
const cases=['/v2/api/applications/','/v2/api/applications/count','/v2/api/applications/server-side?page=1&limit=2','/v2/api/applications/999999999999999'];
try{const response=await fetch(original+'/v2/api/applications/',{signal:AbortSignal.timeout(15000)});if(response.ok){const rows=await response.json();if(Array.isArray(rows)){const row=rows.find(r=>Number.isSafeInteger(Number(r.id))&&Number(r.id)>0);if(row)cases.push('/v2/api/applications/'+row.id);}}}catch{}
const normalize=x=>Array.isArray(x)?x.map(normalize):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,normalize(x[k])])):x;
const differences=(a,b,path='',out=[])=>{if(out.length>=10||Object.is(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){
 if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)out.push(`${path}.length`);for(let i=0;i<Math.min(a.length,b.length,4);i++)differences(a[i],b[i],`${path}[${i}]`,out);}else if(!Array.isArray(a)&&!Array.isArray(b)){for(const key of new Set([...Object.keys(a),...Object.keys(b)])){if(out.length>=10)break;if(!(key in a)||!(key in b))out.push(`${path}.${key} missing`);else differences(a[key],b[key],`${path}.${key}`,out);}}else out.push(path||'$');
 }else out.push(path||'$');return out;};
let match=0,diff=0,error=0;
try{for(const path of cases){try{const [a,b]=await Promise.all([fetch(original+path,{signal:AbortSignal.timeout(15000)}),fetch(next+path,{signal:AbortSignal.timeout(15000)})]);const [left,right]=await Promise.all([a.json(),b.json()]);if(a.status===b.status&&JSON.stringify(normalize(left))===JSON.stringify(normalize(right))){match++;console.log('MATCH',path,'HTTP',a.status);}else{diff++;console.log('DIFF',path,'legacy='+a.status,'native='+b.status,'fields='+differences(left,right).join(','));}}catch(e){error++;console.log('ERROR',path,e.cause?.code||e.code||e.name||'REQUEST_FAILED');}}
}finally{await new Promise(ok=>server.close(ok));}
console.log(`BULK126 EXPRESS-NEXT PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);
console.log('Only listed GET cases compared; no writes or attachments exercised.');
if(diff||error)process.exitCode=1;
