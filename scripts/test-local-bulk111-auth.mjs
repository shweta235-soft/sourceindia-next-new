/** Live locally authenticated Buyer, GET-only plus invalid/foreign-origin POST probes.
 * Neither valid same-origin POST nor business write/upload/email/delete is attempted.
 */
import {readFileSync} from 'node:fs';
import {diagnoseLocalBuyerCredentials} from './bulk111-local-login-diagnostic.mjs';
let origin;
try{
 const base=new URL(process.env.LOCAL_TEST_BASE_URL||'http://localhost:3000');
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.pathname!=='/'||base.search||base.hash||!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error();
 origin=base.origin;
}catch{console.error('LOCAL_TEST_BASE_URL must be localhost root');process.exit(1);}
let creds;try{creds=JSON.parse(Buffer.from(readFileSync(0,'utf8').trim(),'base64').toString('utf8'));}catch{console.error('Invalid hidden Buyer login input');process.exit(1);}
if(typeof creds?.email!=='string'||typeof creds?.password!=='string'||!creds.email||!creds.password){console.error('Existing Buyer email and password required');process.exit(1);}
let pass=0,fail=0,skip=0,token='',buyerId=null;
const base='/api/local/dashboard';
async function call(path,method='GET',body,foreignOrigin=false){
 const headers={Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(method!=='GET'?{Origin:foreignOrigin?'https://other.example':origin,'Content-Type':'application/json'}:{})};
 let status=0,code='NONE',data=null,elapsedMs=0;
 const started=Date.now();
 try{
  const response=await fetch(origin+path,{method,headers,redirect:'manual',signal:AbortSignal.timeout(30000),...(body===undefined?{}:{body:JSON.stringify(body)})});
  status=response.status;
  if(!(response.headers.get('content-type')||'').includes('json'))code='NON_JSON';
  else{const content=await response.text();if(content.length>4000000)code='LARGE_RESPONSE';else{try{data=JSON.parse(content)}catch{code='JSON_PARSE_ERROR';}}}
 }catch(e){code=e?.name==='TimeoutError'||e?.name==='AbortError'?'REQUEST_TIMEOUT':typeof e?.cause?.code==='string'?e.cause.code:'FETCH_ERROR';}
 elapsedMs=Date.now()-started;
 return {status,code,data,elapsedMs};
}
function check(name,r,expected,shape=()=>true){
 const ok=r.status===expected&&r.code==='NONE'&&shape(r.data);
 console.log(`${ok?'PASS':'FAIL'} ${name}: HTTP=${r.status} expected=${expected}`);
 if(!ok){const reason=r.data?.diagnostic?.code||r.code;const stage=r.data?.diagnostic?.stage||'not-returned';console.log(`  SAFE DIAG ${name}: reason=${reason}; stage=${stage}; elapsedMs=${r.elapsedMs}`);}
 if(ok)pass++;else fail++;return ok;
}
try{
 check('Anonymous buyer-interest protected',await call(base+'/buyer-interest'),401,d=>typeof d?.message==='string');
 const login=await call('/api/local/auth/login','POST',creds);
 if(!check('Buyer local login',login,200,d=>typeof d?.token==='string'&&d?.user?.is_seller===0)){
  if(login.status===401){
   const diagnosis=await diagnoseLocalBuyerCredentials(creds.email,creds.password);
   console.log('  LOCAL BUYER DIAG: '+diagnosis);
   console.log('  INFO: Browser /login uses NEXT_PUBLIC_API_BASE_URL /signup/login; this test uses localhost /api/local/auth/login and local MySQL. Browser PASS does not verify local JWT login.');
  }
  creds=null;throw Error('Buyer local JWT login failed');
 }
 creds=null;
 token=login.data.token;buyerId=Number(login.data.user.id);
 if(!Number.isSafeInteger(buyerId)||buyerId<=0){fail++;console.log('FAIL missing buyer identity');throw Error('Invalid local account response');}
 if(!check('Signed Buyer session',await call('/api/local/auth/session'),200,d=>Number(d?.user?.id)===buyerId))throw Error('Buyer JWT verification failed');
 const probes=[
  ['buyer-interest',base+'/buyer-interest',d=>Array.isArray(d?.categories)&&typeof d?.subCategories==='object'],
  ['get-buyer-interest',base+'/get-buyer-interest',d=>Array.isArray(d?.categories)&&typeof d?.checked==='object'],
  ['get-itemtype',base+'/get-itemtype',d=>Array.isArray(d?.categories)],
  ['get-products',base+'/get-products',d=>d?.status===true&&Array.isArray(d?.data)],
  ['get-seller-company',base+'/get-seller-company',d=>d?.status===true&&Array.isArray(d?.data)],
  ['get-item-subcategory empty category',base+'/get-item-subcategory?categoryId=2147483646',d=>Array.isArray(d?.subcategories)&&typeof d?.checkedCount==='number'],
  ['owner userId accepted',base+'/get-products?userId='+buyerId,d=>Array.isArray(d?.data)]
 ];
 for(const [name,path,shape] of probes)check(name,await call(path),200,shape);
 const negatives=[
  ['other buyer blocked','/get-products?userId='+(buyerId===1?2:1),403],
  ['invalid user ID','/get-products?userId=1%20OR%201=1',400],
  ['duplicate user ID','/get-products?userId='+buyerId+'&userId='+buyerId,400],
  ['unknown SQL sort','/get-products?sortBy=password',400],
  ['missing category','/get-item-subcategory',400],
  ['invalid category','/get-item-subcategory?categoryId=1%20OR%201=1',400],
  ['unknown filter','/get-buyer-interest?private=true',400]
 ];
 for(const [name,path,expected] of negatives)check(name,await call(base+path),expected,d=>typeof d?.message==='string');
 // No valid same-origin POST is issued. Even if user mistakenly enables writes,
 // each test is denied before reaching transaction/DB mutation code.
 token='';check('Anonymous buyer write blocked',await call(base+'/store-buyer-interest','POST',{userId:buyerId,activity:{1:[1]}}),401,d=>typeof d?.message==='string');
 token=login.data.token;
 check('Foreign origin buyer interest blocked',await call(base+'/store-buyer-interest','POST',{userId:buyerId,activity:{1:[1]}},true),403,d=>typeof d?.message==='string');
 check('Foreign origin sourcing write blocked',await call(base+'/store-item-subcategory','POST',{userId:buyerId,activity:{category_id:1,subcategory_ids:[1],action:'add'}},true),403,d=>typeof d?.message==='string');
}catch{ /* specific failure already printed without credentials */ }
finally{
 token='';creds=null;
 console.log('------------------------------------');
 console.log(`BULK111 BUYER AUTH RESULTS: PASS=${pass} FAIL=${fail} SKIP=${skip} TOTAL=${pass+fail}`);
 console.log('Buyer bearer GETs and denied POST probes only. No valid writes, emails, uploads or deletions.');
 if(fail)process.exitCode=1;
}
