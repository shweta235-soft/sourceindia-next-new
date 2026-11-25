// Bulk94: read-only Admin Testimonials smoke test. Password only via stdin, never logged.
import {readFileSync} from 'node:fs';
const base = process.env.LOCAL_TEST_BASE_URL || 'http://localhost:3000';
const origin = new URL(base).origin;
let input;
try { input = JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8')); }
catch { console.error('Invalid credential input. Use the included Windows PowerShell .ps1 wrapper.'); process.exit(1); }
const email = typeof input.email==='string' ? input.email.trim() : '';
const password = typeof input.password==='string' ? input.password : '';
input = null;
if (!email || !password) {console.error('Admin email and password required.');process.exit(1);}
let pass=0,fail=0,skipped=0;
async function request(path,{method='GET',body,cookie}={}){
 try {
  const res=await fetch(origin+path,{method,redirect:'manual',cache:'no-store',headers:{Accept:'application/json',...(cookie?{Cookie:cookie}:{}),...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
  const json=(res.headers.get('content-type')||'').toLowerCase().includes('application/json');
  const payload=json?await res.json().catch(()=>null):null;
  return {status:res.status,json,payload,setCookie:res.headers.get('set-cookie')||''};
 } catch { return {status:0,json:false,payload:null,setCookie:''}; }
}
function check(label,result,status,predicate=()=>true){
 const ok=result.status===status&&result.json&&predicate(result.payload);
 console.log(`${label}: HTTP ${result.status}${result.json?' JSON':''} ${ok?'PASS':`FAIL (expected ${status} JSON)`}`);
 ok?pass++:fail++;
}
function results(){
 console.log('------------------------------------');
 console.log(`BULK94 AUTHENTICATED RESULTS: PASS=${pass} FAIL=${fail} SKIPPED=${skipped} TOTAL=${pass+fail+skipped}`);
 console.log('No testimonials printed or modified. Credentials and cookie not printed.');
 if(fail)process.exitCode=1;
}
const login=await request('/api/admin-session',{method:'POST',body:{email,password}});
if(login.status!==200||!login.json){console.log(`Admin login: HTTP ${login.status} FAIL`);console.log('BULK94 AUTHENTICATED RESULTS: NOT RUN (Admin login unavailable)');process.exitCode=1;}
else{
 const match=login.setCookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
 if(!match){console.log('Admin login: session cookie missing.');console.log('BULK94 AUTHENTICATED RESULTS: NOT RUN (cookie missing)');process.exitCode=1;}
 else{
  const cookie=`si_admin_session=${match[1]}`;
  check('Admin login + cookie',login,200);
  const session=await request('/admin/session-status',{cookie});
  check('Admin session status',session,200,p=>p?.authenticated===true);
  if(session.payload?.authenticated!==true){console.log('Admin session not valid. Confirm server restart and ADMIN_SESSION_SECRET configuration.');results();}
  else {
   check('Admin testimonials list',await request('/admin/api/local/testimonials',{cookie}),200,p=>Array.isArray(p?.items));
   check('Admin testimonials count',await request('/admin/api/local/testimonials/count',{cookie}),200,p=>Number.isFinite(p?.total));
   check('Invalid testimonial detail ID',await request('/admin/api/local/testimonials/invalid',{cookie}),400);
   check('Invalid deleted filter',await request('/admin/api/local/testimonials?deleted=unknown',{cookie}),400);
   check('Test-session logout',await request('/api/admin-session',{method:'DELETE'}),200);
   check('Testimonials access after logout',await request('/admin/api/local/testimonials'),401);
   results();
  }
 }
}
