/** Signed Admin, GET-only, JSON shape + negative security probes. No business writes. */
import {readFileSync} from 'node:fs';
let origin;
try{
 const base=new URL(process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000');
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.pathname!=='/'||base.search||base.hash||!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error();
 origin=base.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be localhost root');process.exit(1);}
let creds;
try{creds=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));}
catch{console.error('Invalid hidden Admin credentials');process.exit(1);}
if(typeof creds?.email!=='string'||typeof creds?.password!=='string'||!creds.email||!creds.password){console.error('Admin email/password required');process.exit(1);}
let pass=0,fail=0,skip=0,cookie='';
async function call(path,method='GET',payload){
 const headers={Accept:'application/json',...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=origin;headers['Content-Type']='application/json';}
 let status=0,code='NONE',data=null,setCookie='';
 try{
  const response=await fetch(origin+path,{method,headers,redirect:'manual',signal:AbortSignal.timeout(30000),...(payload===undefined?{}:{body:JSON.stringify(payload)})});
  status=response.status;setCookie=response.headers.get('set-cookie')||'';
  if(!(response.headers.get('content-type')||'').includes('json')){code='NON_JSON';}
  else{const content=await response.text();if(content.length>5000000){code='LARGE_RESPONSE';}else{try{data=JSON.parse(content)}catch{code='JSON_PARSE_ERROR';}}}
 }catch(e){code=e?.name==='TimeoutError'||e?.name==='AbortError'?'REQUEST_TIMEOUT':typeof e?.cause?.code==='string'?e.cause.code:'FETCH_ERROR';}
 return {status,code,data,setCookie};
}
function check(name,r,expected,shape=()=>true){
 const ok=r.status===expected&&r.code==='NONE'&&shape(r.data);
 console.log(`${ok?'PASS':'FAIL'} ${name}: HTTP=${r.status} expected=${expected}`);
 if(!ok){
  const safeCode=r.data?.diagnostic?.code||r.code;
  const stage=r.data?.diagnostic?.stage||'not-returned';
  console.log(`  SAFE DIAG ${name}: reason=${safeCode}; stage=${stage}`);
 }
 if(ok)pass++;else fail++;return ok;
}
const base='/admin/api/local';
try{
 check('Anonymous seller analytics rejected',await call(base+'/sellers/chart'),401,d=>typeof d?.message==='string');
 const login=await call('/api/admin-session','POST',creds);creds=null;
 if(!check('Admin login',login,200,d=>typeof d?.destination==='string'))throw Error('Login unsuccessful');
 const raw=login.setCookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
 if(!raw){fail++;console.log('FAIL signed Admin session cookie missing');throw Error('No admin session');}
 cookie='si_admin_session='+raw[1];
 if(!check('Admin session',await call('/admin/session-status'),200,d=>d?.authenticated===true))throw Error('Invalid session');
 const probes=[
  ['sellers:trends','/sellers/trends',d=>d?.active&&d?.inactive&&d?.notApproved&&d?.notCompleted],
  ['sellers:chart','/sellers/chart',Array.isArray],
  ['sellers:chart ALLACTIVE','/sellers/chart?type=ALLACTIVE',Array.isArray],
  ['buyers:chart','/buyers/chart',Array.isArray],
  ['sellers:categories','/sellers/seller-categories',d=>d?.success===true&&Array.isArray(d.data)],
  ['sellers:with-messages','/sellers/with-messages',d=>Array.isArray(d?.user_ids)],
  ['sellers:designations','/sellers/designations',Array.isArray],
  ['sellers:designations active','/sellers/designations?status=1',Array.isArray],
  ['sellers:nature_business','/sellers/nature_business',Array.isArray],
  ['buyers:empty-interest','/buyers/get-buyer-sourcing-interests?user_id=2147483646',d=>Array.isArray(d?.data)],
 ];
 const results=new Map();
 for(const [name,path,shape] of probes){const r=await call(base+path);results.set(name,r);check(name,r,200,shape);}
 const negatives=[
  ['/sellers/trends?period=hour','invalid trend period'],
  ['/sellers/chart?startDate=2000-01-01&endDate=2026-11-26','unbounded chart range'],
  ['/sellers/chart?type=secret','invalid chart type'],
  ['/sellers/seller-subcategories','missing category ID'],
  ['/sellers/seller-subcategories-by-user?category_id=1','missing user ID'],
  ['/sellers/seller-message/invalid-id','invalid seller message ID'],
  ['/sellers/designations?status=DROP','invalid designation status'],
  ['/buyers/get-buyer-sourcing-interests?user_id=1%20OR%201=1','invalid buyer ID'],
  ['/buyers/chart?sortBy=password','SQL sort injection rejected'],
 ];
 for(const [path,name] of negatives)check(name,await call(base+path),400,d=>typeof d?.message==='string');
 const categories=results.get('sellers:categories')?.data?.data;
 const catId=categories?.find(x=>Number.isSafeInteger(Number(x?.id))&&Number(x.id)>0)?.id;
 if(catId){
  check('seller-subcategories live',await call(base+'/sellers/seller-subcategories?category_id='+catId),200,Array.isArray);
  check('seller-subcategories-by-user live',await call(base+'/sellers/seller-subcategories-by-user?category_id='+catId+'&user_id=2147483646'),200,Array.isArray);
 }else{skip+=2;console.log('SKIP seller category lookup: no active category rows');}
 const userId=results.get('sellers:with-messages')?.data?.user_ids?.find(x=>Number.isSafeInteger(Number(x))&&Number(x)>0);
 if(userId)check('seller-message live',await call(base+'/sellers/seller-message/'+userId),200,d=>d?.data&&d?.data.user_id==userId);
 else{skip++;console.log('SKIP seller-message live: no seller message rows');}
}catch{ /* specific failure already printed */ }
finally{
 creds=null;cookie='';
 console.log('------------------------------------');
 console.log(`BULK110 AUTH READ RESULTS: PASS=${pass} FAIL=${fail} SKIP=${skip} TOTAL=${pass+fail}`);
 console.log('Only Admin login and signed Admin GETs. No business writes, emails, uploads or deletions.');
 if(fail)process.exitCode=1;
}
