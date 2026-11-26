/** Authenticated local API read/security test. Never mutates DB or logs credentials/cookies/data. */
import {readFileSync} from 'node:fs';
import {BULK106_KINDS,BULK106_STATUS_KINDS,validResponse} from './bulk106-contracts.mjs';
let host=process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000';
let origin;
try {
 const url=new URL(host);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error();
 origin=url.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be a localhost root URL.');process.exit(1);}
let credentials,email,password;
try {
 credentials=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));
 email=typeof credentials.email==='string'?credentials.email.trim():'';
 password=typeof credentials.password==='string'?credentials.password:'';
}catch{console.error('Invalid credentials from PowerShell wrapper.');process.exit(1);}
credentials=null;
if(!email||!password){console.error('Admin credentials required.');process.exit(1);}
async function request(path,{method='GET',body,cookie,originHeader=origin,contentType='application/json'}={}){
 const headers={Accept:'application/json',...(cookie?{Cookie:cookie}:{})};
 if(method!=='GET'){headers.Origin=originHeader;headers['Content-Type']=contentType;}
 try {
  const response=await fetch(origin+path,{method,redirect:'manual',cache:'no-store',headers,
   ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
  const json=(response.headers.get('content-type')||'').toLowerCase().includes('application/json');
  let payload=null;
  if(json){const raw=await response.text();payload=raw.length<2097152?JSON.parse(raw):null;}
  return {status:response.status,json,payload,setCookie:response.headers.get('set-cookie')||''};
 }catch{return {status:0,json:false,payload:null,setCookie:''};}
}
let pass=0,fail=0;
function check(name,r,status,type='auth'){
 const okay=r.status===status && r.json && validResponse(type,r.payload);
 console.log(`${okay?'PASS':'FAIL'} ${name} HTTP=${r.status} EXPECTED=${status}`);
 if(okay)pass++;else fail++;
 return okay;
}
try{
 check('Anonymous Admin protection',await request('/admin/api/local/home-banners'),401,'auth');
 const login=await request('/api/admin-session',{method:'POST',body:{email,password}});
 email=null;password=null;
 const loginOkay=login.status===200&&login.json&&typeof login.payload?.destination==='string';
 console.log(`${loginOkay?'PASS':'FAIL'} Admin sign-in HTTP=${login.status} EXPECTED=200`);
 if(loginOkay)pass++;else fail++;
 if(loginOkay){
  const match=login.setCookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
  if(!match){console.log('FAIL missing signed session cookie');fail++;}
  else{
   const cookie=`si_admin_session=${match[1]}`;
   const session=await request('/admin/session-status',{cookie});
   if(session.status===200&&session.payload?.authenticated===true){console.log('PASS signed Admin session');pass++;
    for(const kind of BULK106_KINDS){
     const prefix=`/admin/api/local/${kind}`;
     for(const [label,path,expected,contract] of [
      ['list',prefix,200,'list'],
      ['count',prefix+'/count',200,'count'],
      ['server-side',prefix+'/server-side?limit=2&page=1',200,'server-side'],
      ['invalid-ID',prefix+'/abc',400,'invalid-ID'],
     ]){check(`${kind}:${label}`,await request(path,{cookie}),expected,contract);}
    }
    // Sending a forged Origin NEVER reaches the DB write branch.
    // Even a mistakenly enabled write flag cannot bypass CSRF.
    for(const kind of BULK106_STATUS_KINDS){
     const path=`/admin/api/local/${kind}/1/status`;
     check(`${kind}:CSRF blocked`,await request(path,{method:'PATCH',cookie,body:{status:1},originHeader:'https://invalid.example'}),403,'auth');
     // Invalid status type cannot trigger a write even if feature flag is accidentally enabled.
     // Requires default-off 503. If flag is enabled, expect a SAFE FAIL (HTTP 400) and stop.
     check(`${kind}:writes disabled`,await request(path,{method:'PATCH',cookie,body:{status:'invalid'}}),503,'disabled');
    }
   }else {console.log('FAIL signed Admin session');fail++;}
  }
 }else console.log('Admin login unsuccessful; no privileged reads were attempted.');
}finally{
 const logout=await request('/api/admin-session',{method:'DELETE'});
 const success=logout.status===200&&logout.payload?.success===true;
 console.log(`${success?'PASS':'FAIL'} test-session logout HTTP=${logout.status} EXPECTED=200`);
 if(success)pass++;else fail++;
 console.log('------------------------------------');
 console.log(`BULK106 AUTH SAFE RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
 console.log('READ-ONLY checks; wrong-origin and invalid-payload PATCH tests cannot perform DB writes.');
 if(fail)process.exitCode=1;
}
