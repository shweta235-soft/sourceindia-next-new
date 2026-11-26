/** Bulk107: live Auth+CSRF+default-off verification. NO data writes.
 *  - same-origin write probes use INVALID {} bodies, incapable of passing validation
 *  - DELETE probes ALWAYS use wrong origin or no login (never same-origin)
 *  - never prints login credentials, cookies or response data
 */
import {readFileSync} from 'node:fs';
const KINDS=['product-categories','product-subcategories','item-categories','item-subcategories','product-keywords','home-banners','home-settings','static-pages','mail-master','designations','nature-businesses','user-categories'];
const SOFT_DELETE=['home-banners','static-pages'];
let origin;
try{
 const url=new URL(process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000');
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error();
 origin=url.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be localhost root.');process.exit(1);}
let credentials,email,password;
try{
 credentials=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));
 email=typeof credentials.email==='string'?credentials.email.trim():'';
 password=typeof credentials.password==='string'?credentials.password:'';
}catch{console.error('Invalid credentials input.');process.exit(1);}
credentials=null;
if(!email||!password){console.error('Admin email/password required.');process.exit(1);}
async function request(path,method='GET',cookie='',body,originHeader=origin){
 const headers={Accept:'application/json',...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=originHeader;headers['Content-Type']='application/json';}
 try{
  const response=await fetch(origin+path,{method,headers,redirect:'manual',cache:'no-store',
   ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
  const json=(response.headers.get('content-type')||'').toLowerCase().includes('application/json');
  let data=null;
  if(json){const raw=await response.text();data=raw.length<=2097152?JSON.parse(raw):null;}
  return {status:response.status,json,data,cookie:response.headers.get('set-cookie')||''};
 }catch{return {status:0,json:false,data:null,cookie:''};}
}
let pass=0,fail=0;
function check(name,result,expected,mode='error'){
 const valid=mode==='list'?Array.isArray(result.data?.items):
 mode==='session'?result.data?.authenticated===true:
 mode==='login'?typeof result.data?.destination==='string':
 mode==='logout'?result.data?.success===true:
 typeof result.data?.message==='string';
 const ok=result.status===expected&&result.json&&valid;
 console.log(`${ok?'PASS':'FAIL'} ${name} HTTP=${result.status} EXPECTED=${expected}`);
 if(ok)pass++;else fail++;
 return ok;
}
try{
 check('Anonymous Admin list protected',await request('/admin/api/local/product-categories'),401);
 const login=await request('/api/admin-session','POST','',{email,password});
 email=null;password=null;
 if(check('Existing Admin sign-in',login,200,'login')){
  const found=login.cookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
  if(!found){console.log('FAIL Admin signed session cookie missing');fail++;}
  else{
   const cookie=`si_admin_session=${found[1]}`;
   if(check('Signed Admin session',await request('/admin/session-status','GET',cookie),200,'session')){
    for(const kind of KINDS){
     const base=`/admin/api/local/${kind}`;
     check(`${kind}:existing read`,await request(base,'GET',cookie),200,'list');
     const id=base+'/1';
     for(const [action,route,method] of [['create',base,'POST'],['update',id,'PUT']]){
      // This client never sends a valid payload in same-origin requests.
      check(`${kind}:${action}:anonymous`,await request(route,method,'',{}),401);
      check(`${kind}:${action}:CSRF denied`,await request(route,method,cookie,{},'https://invalid.example'),403);
      check(`${kind}:${action}:default OFF`,await request(route,method,cookie,{}),503);
     }
    }
    for(const kind of SOFT_DELETE){
     const path=`/admin/api/local/${kind}/1`;
     check(`${kind}:delete:anonymous`,await request(path,'DELETE',''),401);
     // Never send same-origin DELETE, even when opt-in flag is mistakenly enabled.
     check(`${kind}:delete:CSRF denied`,await request(path,'DELETE',cookie,undefined,'https://invalid.example'),403);
    }
   }
  }
 }else console.log('Admin login unsuccessful; privileged requests skipped.');
}finally{
 const logout=await request('/api/admin-session','DELETE');
 check('Test-session logout endpoint',logout,200,'logout');
 console.log('------------------------------------');
 console.log(`BULK107 AUTH SAFE RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
 console.log('No valid same-origin writes, email sends, uploads, or destructive DB operations attempted.');
 if(fail)process.exitCode=1;
}
