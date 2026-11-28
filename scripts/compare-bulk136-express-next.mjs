/** BULK136 read-only GET parity. Never compare site: original public site includes SMTP secrets. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Could not load .env.local');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Legacy dependencies missing: npm run setup:legacy:compat');process.exit(1);}
const server=createServer(app);await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
const source=`http://127.0.0.1:${server.address().port}`;const native=process.env.BULK136_URL||'http://localhost:3000';
const paths=['/v2/api/settings/front-site','/v2/api/settings/home'];
function diff(a,b,path='',out=[]){if(out.length>12||Object.is(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){
 if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)out.push(path+'.length');for(let i=0;i<Math.min(a.length,b.length,3);i++)diff(a[i],b[i],`${path}[${i}]`,out);}
 else if(!Array.isArray(a)&&!Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(!(k in a)||!(k in b))out.push(`${path}.${k}`);else diff(a[k],b[k],`${path}.${k}`,out);}}else out.push(path);
 }else out.push(path);return out;}
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
let match=0,differences=0,error=0;
try{for(const path of paths){try{const [a,b]=await Promise.all([fetch(source+path,{signal:AbortSignal.timeout(15000)}),fetch(native+path,{signal:AbortSignal.timeout(15000)})]);const [x,y]=await Promise.all([a.json(),b.json()]);if(a.status===b.status&&JSON.stringify(canonical(x))===JSON.stringify(canonical(y))){match++;console.log('MATCH',path,a.status);}else{differences++;console.log('DIFF',path,`legacy=${a.status}`,`native=${b.status}`,`fields=${diff(x,y).join(',')}`);}}catch(e){error++;console.log('ERROR',path,e.cause?.code||e.code||e.name);}}}finally{await new Promise(ok=>server.close(ok));}
console.log(`BULK136 GET PARITY RESULTS: MATCH=${match} DIFF=${differences} ERROR=${error} TOTAL=${paths.length}`);
console.log('Only two public GET cases; private /site and write/upload parity not tested.');if(differences||error)process.exitCode=1;
