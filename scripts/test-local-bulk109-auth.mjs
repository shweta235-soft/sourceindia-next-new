/** LIVE signed Admin GET-only verification. Credentials are read from hidden prompt
 * stdin, used for login once, then cleared. Prints no credentials or cookies.
 * No POST other than login, no PATCH, PUT, DELETE except optional logout.
 */
import {readFileSync} from 'node:fs';
const kinds=['sellers','buyers','users','companies','enquiries','tickets','buyer-enquiries'];
let origin;
try{
 const base=new URL(process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000');
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.pathname!=='/'||base.search||base.hash||!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error();
 origin=base.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be localhost root.');process.exit(1);}
let loginInput;
try{loginInput=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));}
catch{console.error('Invalid hidden Admin credentials input.');process.exit(1);}
if(typeof loginInput?.email!=='string'||typeof loginInput?.password!=='string'||!loginInput.email.trim()||!loginInput.password){console.error('Admin email/password required.');process.exit(1);}
// Keep HTTP response status even if the body is malformed or interrupted.
// HTTP=0 is reserved for an actual request failure before receiving a status.
function safeRequestCode(error){
 const name=typeof error?.name==='string'?error.name:'';
 if(name==='AbortError'||name==='TimeoutError')return 'REQUEST_TIMEOUT';
 if(name==='SyntaxError')return 'JSON_PARSE_ERROR';
 const code=error?.cause?.code;
 return typeof code==='string'&&/^[A-Z][A-Z0-9_]{2,47}$/.test(code)?code:'FETCH_ERROR';
}
async function request(path,method='GET',cookie='',body){
 const headers={Accept:'application/json',...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=origin;headers['Content-Type']='application/json';}
 // Big server-side reports may legitimately need more than the ordinary 20s
 // GET budget, especially with a sizeable existing database.
 const timeout=path.includes('/server-side')?60000:20000;
 const start=Date.now();
 let status=0,stage='fetch';
 try{
  const response=await fetch(origin+path,{method,headers,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(timeout),...(body===undefined?{}:{body:JSON.stringify(body)})});
  status=response.status;stage='response-body';
  const json=(response.headers.get('content-type')||'').toLowerCase().includes('json');
  if(!json)return {status,data:null,json:false,cookie:response.headers.get('set-cookie')||'',clientDiagnostic:{code:'NON_JSON_RESPONSE',stage},elapsedMs:Date.now()-start};
  const content=await response.text();
  if(content.length>5000000)return {status,data:null,json:false,cookie:'',clientDiagnostic:{code:'RESPONSE_TOO_LARGE',stage},elapsedMs:Date.now()-start};
  let data=null;
  if(content){
   stage='json-parse';
   try{data=JSON.parse(content)}catch{return {status,data:null,json:false,cookie:'',clientDiagnostic:{code:'JSON_PARSE_ERROR',stage},elapsedMs:Date.now()-start};}
  }
  return {status,data,json:true,cookie:response.headers.get('set-cookie')||'',elapsedMs:Date.now()-start};
 }catch(error){return {status,data:null,json:false,cookie:'',clientDiagnostic:{code:safeRequestCode(error),stage},elapsedMs:Date.now()-start};}
}
let pass=0,fail=0,skip=0;
function check(name,r,status,validator=()=>true){
 const ok=r.status===status&&r.json&&validator(r.data);
 console.log(`${ok?'PASS':'FAIL'} ${name}: HTTP=${r.status} expected=${status}`);
 if(!ok){
  const diagnostic=r.data?.diagnostic;
  const code=typeof r.clientDiagnostic?.code==='string'?r.clientDiagnostic.code:
   typeof diagnostic?.code==='string'?diagnostic.code:(r.status===status?'RESPONSE_SHAPE':'HTTP_STATUS');
  const stage=typeof r.clientDiagnostic?.stage==='string'?r.clientDiagnostic.stage:
   typeof diagnostic?.stage==='string'?diagnostic.stage:'not-returned';
  console.log(`  SAFE DIAG ${name}: reason=${code}; stage=${stage}; elapsedMs=${r.elapsedMs??0}`);
 }
 if(ok)pass++;else fail++;
 return ok;
}
function safe(data){
 const blocked=new Set(['password','real_password','otp','remember_token','email_token','token']);
 function inner(x){if(!x||typeof x!=='object')return true;for(const [k,v] of Object.entries(x)){if(blocked.has(k.toLowerCase()))return false;if(!inner(v))return false;}return true;}
 return inner(data);
}
let cookie='';
try{
 check('Anonymous seller listing protected',await request('/admin/api/local/sellers'),401,d=>typeof d?.message==='string');
 const login=await request('/api/admin-session','POST','',loginInput);
 loginInput=null;
 if(!check('Admin login',login,200,d=>typeof d?.destination==='string'))throw Error('No signed Admin session');
 const raw=login.cookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
 if(!raw){fail++;console.log('FAIL Signed Admin cookie missing');throw Error('Missing session');}
 cookie='si_admin_session='+raw[1];
 if(!check('Signed Admin status',await request('/admin/session-status','GET',cookie),200,d=>d?.authenticated===true))throw Error('Admin session invalid');
 for(const kind of kinds){
  const path='/admin/api/local/'+kind;
  const q='?page=1&limit=1';
  const list=await request(path+q,'GET',cookie);
  if(kind==='tickets'&&list.status===403){check('Ticket scope denies unauthorized Admin',list,403,d=>typeof d?.message==='string');skip+=7;console.log('SKIP ticket read-only probes: Admin role/category denies access');continue;}
  if(!check(`${kind}:list`,list,200,d=>Array.isArray(d?.items)&&safe(d))){
   // Diagnostic GET probes are intentionally not counted in the 59-check contract.
   for(const [name,suffix] of [['count','/count'],['summary','/summary']]){
    const probe=await request(path+suffix,'GET',cookie);
    const detail=probe.data?.diagnostic;
    console.log(`  SAFE DIAG ${kind}:${name} HTTP=${probe.status} reason=${detail?.code??(probe.json?'NONE':'NON_JSON')} stage=${detail?.stage??'not-returned'}`);
   }
   continue;
  }
  check(`${kind}:count`,await request(path+'/count','GET',cookie),200,d=>Number.isFinite(d?.total));
  check(`${kind}:server-side`,await request(path+'/server-side'+q,'GET',cookie),200,d=>Array.isArray(d?.data)&&Number.isFinite(d?.totalRecords)&&Number.isFinite(d?.filteredRecords)&&safe(d));
  check(`${kind}:filtered`,await request(path+'/filtered'+q,'GET',cookie),200,d=>Array.isArray(d?.data)&&Number.isFinite(d?.totalRecords)&&safe(d));
  check(`${kind}:summary`,await request(path+'/summary','GET',cookie),200,d=>Number.isFinite(d?.total));
  check(`${kind}:invalid ID`,await request(path+'/invalid-id','GET',cookie),400,d=>typeof d?.message==='string');
  check(`${kind}:invalid SQL sort`,await request(path+'?sortBy=password','GET',cookie),400,d=>typeof d?.message==='string');
  check(`${kind}:invalid pagination`,await request(path+'?page=0','GET',cookie),400,d=>typeof d?.message==='string');
  const first=list.data?.items?.[0];
  if(Number.isSafeInteger(Number(first?.id))&&Number(first.id)>0){
   check(`${kind}:live detail`,await request(path+'/'+first.id,'GET',cookie),200,d=>d?.item&&Number(d.item.id)===Number(first.id)&&safe(d));
  }else{skip++;console.log(`SKIP ${kind}:detail - table has no visible rows`);}
 }
}catch{ /* Checked failures above, not repeated here */ }
finally{
 loginInput=null;cookie='';
 check('Logout response',await request('/api/admin-session','DELETE'),200,d=>d?.success===true);
 console.log('------------------------------------');
 console.log(`BULK109 AUTH READ RESULTS: PASS=${pass} FAIL=${fail} SKIP=${skip} TOTAL=${pass+fail}`);
 console.log('Only signed Admin GETs and authentication requests; no business writes, emails, uploads or deletions.');
 if(fail)process.exitCode=1;
}
