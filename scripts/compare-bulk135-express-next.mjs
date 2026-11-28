/** GET-only read parity; does not mutate database or prove write parity. */
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.env.DB_NAME){console.error('DB_NAME missing');process.exit(1);}
const legacy=resolve('legacy/sourceindia-express/compat-app.cjs');
let app;try{app=createRequire(legacy)(legacy);}catch{console.error('Run npm run setup:legacy:compat first.');process.exit(1);}
const server=createServer(app);await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
const original=`http://127.0.0.1:${server.address().port}`,native=process.env.BULK135_URL||'http://localhost:3000';
const root='/v2/api/shortcut/shortcut_menus';
const cases=[root,root+'?search=not-expected-bulk135',root+'?status=1',root+'?status=0'];
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canon(v)])):x;
// Report only mismatching field paths, never full response bodies or private data.
function differences(left,right,path='',out=[],limit=12){
 if(out.length>=limit)return out;
 if(Object.is(left,right))return out;
 if(Array.isArray(left)&&Array.isArray(right)){
  if(left.length!==right.length)out.push((path||'<root>')+'.length');
  for(let i=0;i<Math.min(left.length,right.length)&&out.length<limit;i++)differences(left[i],right[i],`${path}[${i}]`,out,limit);
  return out;
 }
 if(left!==null&&right!==null&&typeof left==='object'&&typeof right==='object'&&!Array.isArray(left)&&!Array.isArray(right)){
  for(const key of new Set([...Object.keys(left),...Object.keys(right)])){
   if(out.length>=limit)break;
   if(!Object.hasOwn(left,key)||!Object.hasOwn(right,key)){out.push(path?path+'.'+key:key);continue;}
   differences(left[key],right[key],path?path+'.'+key:key,out,limit);
  }
  return out;
 }
 out.push(path||'<root>');return out;
}
function firstDateDelta(left,right){
 const find=(a,b)=>{
  if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'){
   for(const key of Object.keys(a)){
    if(!Object.hasOwn(b,key))continue;
    if(/^(created_at|updated_at)$/.test(key)&&typeof a[key]==='string'&&typeof b[key]==='string'&&a[key]!==b[key]){
     const x=Date.parse(a[key]),y=Date.parse(b[key]);
     if(Number.isFinite(x)&&Number.isFinite(y))return Math.round((y-x)/60000);
    }
    const d=find(a[key],b[key]);if(d!==null)return d;
   }
  }
  return null;
 };
 return find(left,right);
}
let match=0,diff=0,error=0;
try{for(const path of cases){try{const [a,b]=await Promise.all([fetch(original+path,{signal:AbortSignal.timeout(15000)}),fetch(native+path,{signal:AbortSignal.timeout(15000)})]);const [x,y]=await Promise.all([a.json(),b.json()]);if(a.status===b.status&&JSON.stringify(canon(x))===JSON.stringify(canon(y))){match++;console.log('MATCH GET',path,a.status);}else{diff++;console.log('DIFF GET',path,'legacy='+a.status,'native='+b.status,'legacy_type='+typeof x,'native_type='+typeof y,'fields='+JSON.stringify(differences(x,y)),...(firstDateDelta(x,y)===null?[]:['date_delta_minutes='+firstDateDelta(x,y)]));}}catch(e){error++;console.log('ERROR GET',path,e.cause?.code||e.code||e.message);}}}finally{await new Promise(ok=>server.close(ok));}
console.log(`BULK135 SHORTCUT GET PARITY RESULTS: MATCH=${match} DIFF=${diff} ERROR=${error} TOTAL=${cases.length}`);
console.log('Only four GET test cases compared. Writes are not tested.');if(diff||error)process.exitCode=1;
