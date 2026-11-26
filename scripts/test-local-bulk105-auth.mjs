/** Bulk105 authenticated HTTP verification: READ ONLY.
 * Password enters through base64-encoded JSON on stdin from PowerShell, never in argv.
 * No API response bodies, cookies, email/password or DB rows are printed or stored.
 */
import { readFileSync } from 'node:fs';
import { adminReadChecks, validJsonContract } from './bulk105-contracts.mjs';
const base=process.env.LOCAL_TEST_BASE_URL || 'http://localhost:3000';
let origin;
try {const u=new URL(base);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error();origin=u.origin;}
catch{console.error('Invalid LOCAL_TEST_BASE_URL. Use e.g. http://localhost:3000');process.exit(1);}
// Don't accidentally send secrets to a remote service: this tests the user's local machine only.
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname)){
 console.error('Bulk105 auth test permits only a localhost server.');process.exit(1);
}
let input, email, password;
try{
 input=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));
 email=typeof input.email==='string'?input.email.trim():'';
 password=typeof input.password==='string'?input.password:'';
} catch {console.error('Invalid credentials input. Use the PowerShell wrapper.');process.exit(1);}
input=null;
if(!email||!password){console.error('Existing Admin email and password required.');process.exit(1);}
const timeoutMs=20000;
async function request(path,{method='GET',body,cookie,originHeader=origin}={}){
 const headers={Accept:'application/json', ...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=originHeader;headers['Content-Type']='application/json';}
 try{
  const res=await fetch(origin+path,{method,redirect:'manual',cache:'no-store',headers,
   ...(body===undefined?{}:{body:JSON.stringify(body)}), signal:AbortSignal.timeout(timeoutMs)});
  const isJson=(res.headers.get('content-type')||'').toLowerCase().includes('application/json');
  let payload=null;
  if(isJson){const raw=await res.text();payload=raw.length<=1048576?JSON.parse(raw):null;}
  return {status:res.status,isJson,payload,cookieHeader:res.headers.get('set-cookie')||''};
 }catch{return {status:0,isJson:false,payload:null,cookieHeader:''};}
}
let pass=0,fail=0;
function check(name,result,expected,predicate=()=>true){
 const success=result.status===expected&&result.isJson&&predicate(result.payload);
 console.log(`${success?'PASS':'FAIL'} ${name} HTTP=${result.status} EXPECTED=${expected}`);
 if(success)pass++;else fail++;
 return success;
}
function summary(){
 console.log('------------------------------------');
 console.log(`BULK105 AUTH READ RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
 console.log('READ-ONLY. No DB writes, emails, file uploads or destructive operations attempted.');
 if(fail)process.exitCode=1;
}
try{
 // Confirm no cookie means no privileged access.
 const anon=await request('/admin/api/local/roles');
 check('Anonymous Admin protection',anon,401,p=>p!==null);
 const login=await request('/api/admin-session',{method:'POST',body:{email,password}});
 // Minimize lifespan of the raw credential strings.
 email=null;password=null;
 if(!check('Existing Admin sign-in',login,200)){
  console.error('Admin authentication failed; read tests NOT RUN. Check credentials, live auth configuration and ADMIN_SESSION_SECRET.');
 } else {
  const match=login.cookieHeader.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
  if(!match){fail++;console.error('FAIL Signed Admin cookie missing; read tests NOT RUN.');}
  else {
   const cookie=`si_admin_session=${match[1]}`;
   const status=await request('/admin/session-status',{cookie});
   if(check('Signed Admin session',status,200,p=>p?.authenticated===true)){
    for(const item of adminReadChecks()) {
     const result=await request(item.path,{cookie});
     const expected=item.status??200;
     check(item.name,result,expected,p=>validJsonContract(item,p));
    }
    // A forged cross-site request must be rejected BEFORE any data mutation / feature flag.
    for(const resource of ['roles','activities','core-activities','applications','membership-plans','interest-subcategories','shortcut-menus']){
     const result=await request(`/admin/api/local/${resource}`,{method:'POST',body:{},cookie,originHeader:'https://evil.example'});
     check(`${resource}:CSRF blocked`,result,403,p=>p!==null);
    }
   } else console.error('Admin session cookie rejected. Read checks NOT RUN.');
  }
 }
} finally {
 // Our test cookie is not kept in a browser; this is only a no-op session API check.
 const logout=await request('/api/admin-session',{method:'DELETE'});
 check('Test-session logout endpoint',logout,200,p=>p?.success===true);
 summary();
}
