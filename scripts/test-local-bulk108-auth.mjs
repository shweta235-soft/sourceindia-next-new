/** Non-mutating authenticated Bulk108 verification. Credentials arrive via hidden PowerShell stdin.
 * No valid same-origin write payload is sent; DELETE requests are anonymous or cross-origin only.
 */
import {readFileSync} from 'node:fs';
const MODULES=['email-templates','newsletter-circulars','registrations'];
const WRITES=[
 ['email-templates','POST'],['email-templates/1','PUT'],['email-templates/clone','POST'],
 ['newsletter-circulars','POST'],['newsletter-circulars/1','PUT'],['newsletter-circulars/1/images','POST'],
 ['registrations/1/delete-status','PATCH']
];
const DELETES=['email-templates/1','newsletter-circulars/1','newsletter-circulars/1/images/1','registrations/1','registrations/delete-selected'];
const READS=[
 ['email-templates','items'],['email-templates/count','count'],['email-templates/server-side','server'],
 ['newsletter-circulars','items'],['newsletter-circulars/count','count'],['newsletter-circulars/server-side','server'],['newsletter-circulars/user_type','items'],
 ['registrations','items'],['registrations/count','count'],['registrations/server-side','server'],
 ['newsletter-histories/count?newsLatter_id=1','historyCount'],['newsletter-histories/server-side?newsLatter_id=1','server'],
 ['user-activity','items'],['user-activity/count','count'],['user-activity/server-side','server'],['user-activity/user_id/1','activityDetail'],
 ['category-conflict-logs/server-side','server']
];
let origin;
try{
 const url=new URL(process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000');
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error();
 origin=url.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be localhost root.');process.exit(1);}
let email,password;
try{
 const obj=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));
 email=typeof obj.email==='string'?obj.email.trim():'';
 password=typeof obj.password==='string'?obj.password:'';
}catch{console.error('Invalid credentials input.');process.exit(1);}
if(!email||!password){console.error('Admin email/password required.');process.exit(1);}
async function request(path,method='GET',cookie='',body,originHeader=origin){
 const headers={Accept:'application/json',...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=originHeader;headers['Content-Type']='application/json';}
 try{
  const res=await fetch(origin+path,{method,headers,redirect:'manual',cache:'no-store',
   ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
  let data=null;
  const json=(res.headers.get('content-type')||'').includes('application/json');
  if(json){const text=await res.text();data=text.length<=2_000_000?JSON.parse(text):null;}
  return {status:res.status,json,data,cookie:res.headers.get('set-cookie')||''};
 }catch{return {status:0,json:false,data:null,cookie:''};}
}
let pass=0,fail=0;
function check(name,r,status,shape='message'){
 const valid=shape==='items'?Array.isArray(r.data?.items):shape==='count'?typeof r.data?.total==='number':
  shape==='server'?Array.isArray(r.data?.data)&&Number.isInteger(r.data?.totalRecords):
  shape==='historyCount'?typeof r.data?.all==='number':
  shape==='activityDetail'?Array.isArray(r.data?.user_activity):
  shape==='login'?typeof r.data?.destination==='string':
  shape==='session'?r.data?.authenticated===true:shape==='logout'?r.data?.success===true:
  typeof r.data?.message==='string';
 const ok=r.status===status&&r.json&&valid;
 console.log(`${ok?'PASS':'FAIL'} ${name} HTTP=${r.status} expected=${status}`);
 if(ok)pass++;else fail++;
 return ok;
}
try{
 check('Anonymous Admin access protected',await request('/admin/api/local/email-templates'),401);
 const login=await request('/api/admin-session','POST','',{email,password});email=null;password=null;
 if(check('Existing Admin login',login,200,'login')){
  const cookieValue=login.cookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
  if(!cookieValue){fail++;console.log('FAIL Admin session cookie missing');}
  else {
   const cookie=`si_admin_session=${cookieValue[1]}`;
   if(check('Signed Admin session',await request('/admin/session-status','GET',cookie),200,'session')){
    for(const [path,shape] of READS){
     check(`Read ${path}`,await request('/admin/api/local/'+path,'GET',cookie),200,shape);
    }
    for(const [path,method] of WRITES){
     const url='/admin/api/local/'+path;
     check(`${method} ${path}:anon`,await request(url,method,'',{}),401);
     check(`${method} ${path}:CSRF`,await request(url,method,cookie,{},'https://invalid.example'),403);
     check(`${method} ${path}:disabled`,await request(url,method,cookie,{}),503);
    }
    for(const path of DELETES){
     const url='/admin/api/local/'+path;
     check(`DELETE ${path}:anon`,await request(url,'DELETE',''),401);
     // NEVER issue same-origin DELETE, even if an unsafe flag is mistakenly active.
     check(`DELETE ${path}:CSRF`,await request(url,'DELETE',cookie,undefined,'https://invalid.example'),403);
    }
   }
  }
 }else{console.log('Admin login unsuccessful; privileged tests skipped.');}
}finally{
 const logout=await request('/api/admin-session','DELETE');
 check('Logout test session',logout,200,'logout');
 console.log('------------------------------------');
 console.log(`BULK108 AUTH SAFE RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
 console.log('No valid same-origin writes, emails, uploads or physical deletions attempted.');
 if(fail)process.exitCode=1;
}
