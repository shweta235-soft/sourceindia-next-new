import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {BULK106_KINDS,BULK106_RESOURCES,BULK106_STATUS_KINDS,requiredSchema,validResponse} from './bulk106-contracts.mjs';
const root=resolve(import.meta.dirname,'..');
const lib=readFileSync(resolve(root,'src/lib/localBulk106Admin.ts'),'utf8');
test('catalog has 15 distinct whitelisted resources and SQL identifier-safe fields',()=>{
 assert.equal(BULK106_KINDS.length,15);
 for(const [name,d] of Object.entries(BULK106_RESOURCES)){
  assert.match(name,/^[a-z][a-z-]+$/);
  for(const identifier of [d.table,d.key,...d.columns,...d.search,...(d.filterColumn?[d.filterColumn]:[])])assert.match(identifier,/^[a-z_][a-z0-9_]*$/);
  assert.equal(new Set(d.columns).size,d.columns.length);
 }
});
test('all 60 GET endpoints are implemented as real route files',()=>{
 for(const name of BULK106_KINDS){for(const suffix of ['','count','server-side','[id]']){
  const path=resolve(root,'src/app/admin/api/local',name,suffix,'route.ts');
  assert.equal(existsSync(path),true,path);assert.match(readFileSync(path,'utf8'),/export async function GET\(/);
 }}
});
test('all 10 gated status PATCH endpoints exist and no others',()=>{
 assert.equal(BULK106_STATUS_KINDS.length,10);
 for(const name of BULK106_STATUS_KINDS){const file=resolve(root,'src/app/admin/api/local',name,'[id]','status','route.ts');
  assert.ok(existsSync(file),name);assert.match(readFileSync(file,'utf8'),/export async function PATCH\(/);
 }
});
test('authentication, origin and opt-in guards precede every write path',()=>{
 const iAuth=lib.indexOf('if(!authorizedAdminFaq(req))');
 const iOrigin=lib.indexOf('if(!adminFaqSameOrigin(req))');
 const iEnabled=lib.indexOf('if(!bulk106Enabled())');
 const iDb=lib.indexOf('const db=localAccountDatabase()');
 assert.ok(iAuth>=0&&iOrigin>iAuth&&iEnabled>iOrigin&&iDb>iEnabled);
 assert.match(lib,/LOCAL_ADMIN_BULK106_WRITES_ENABLED === 'true'/);
});
test('no read-all, hard delete, mail or upload execution in Bulk106 dispatcher',()=>{
 assert.doesNotMatch(lib,/\bDELETE\s+FROM\b/i);assert.doesNotMatch(lib,/\bINSERT\s+INTO\b/i);
 assert.doesNotMatch(lib,/\bsendMail\s*\(/i);
 assert.match(lib,/LIMIT \? OFFSET \?/);assert.match(lib,/d\.deleted\?' AND is_delete = 0'/);
});
test('expected schema uses only audited columns and distinct tables',()=>{
 assert.equal(Object.keys(requiredSchema()).length,15);
 for(const [table,cols] of Object.entries(requiredSchema())){assert.ok(table.length>0);assert.ok(cols.includes(BULK106_RESOURCES[BULK106_KINDS.find(k=>BULK106_RESOURCES[k].table===table)].key));}
});
test('HTTP contract validators fail closed for malformed payloads',()=>{
 assert.equal(validResponse('count',{total:0}),true);
 assert.equal(validResponse('count',{total:'0'}),false);
 assert.equal(validResponse('list',{items:[],page:1,limit:20}),true);
 assert.equal(validResponse('server-side',{data:[],totalRecords:0,filteredRecords:0}),true);
 assert.equal(validResponse('list',{data:[]}),false);
});
test('test client never sends same-origin status updates with a valid status body',()=>{
 const client=readFileSync(resolve(root,'scripts/test-local-bulk106-auth.mjs'),'utf8');
 assert.match(client,/status:'invalid'/);assert.match(client,/originHeader:'https:\/\/invalid\.example'/);
 assert.doesNotMatch(client,/body:\{status:1\}\}\),503/);
 assert.match(client,/localhost/);
});
test('authenticated 84-check test harness passes against a local read-only mock',async()=>{
 const {createServer}=await import('node:http');
 const {spawn}=await import('node:child_process');
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url||'/', 'http://localhost');
  let body={message:'Admin session required.'},status=401;
  const cookie=req.headers.cookie||'';
  if(url.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){
    body={destination:'/admin/dashboard'};
    res.setHeader('Set-Cookie','si_admin_session=mock-session; Path=/admin; HttpOnly; SameSite=Lax');
   }else body={success:true};
  }else if(url.pathname==='/admin/session-status' && cookie.includes('mock-session')){
   status=200;body={authenticated:true};
  }else if(cookie.includes('mock-session') && url.pathname.startsWith('/admin/api/local/')){
   const segments=url.pathname.split('/').filter(Boolean);
   const kind=segments[3];
   if(BULK106_RESOURCES[kind]){
    if(req.method==='PATCH'){
     status=req.headers.origin==='https://invalid.example'?403:503;
     body={message:'Blocked'};
    }else if(segments.length===4){status=200;body={items:[],page:1,limit:20};}
    else if(segments[4]==='count'){status=200;body={total:0};}
    else if(segments[4]==='server-side'){status=200;body={data:[],totalRecords:0,filteredRecords:0,page:1,limit:2};}
    else if(segments[4]==='abc'){status=400;body={message:'Invalid ID.'};}
   }
  }
  res.writeHead(status,{'Content-Type':'application/json'});
  res.end(JSON.stringify(body));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 try{
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[resolvePath(root,'scripts/test-local-bulk106-auth.mjs')],{
    env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:['pipe','pipe','pipe']});
   let out='',err='';
   child.stdout.on('data',v=>out+=v.toString());
   child.stderr.on('data',v=>err+=v.toString());
   child.on('error',reject);
   child.on('close',code=>resolve({code,out,err}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'example@local.test',password:'superSecretMockPass'})).toString('base64'));
  });
  assert.equal(result.code,0,result.out+'\n'+result.err);
  assert.match(result.out,/BULK106 AUTH SAFE RESULTS: PASS=84 FAIL=0 TOTAL=84/);
  assert.ok(!result.out.includes('superSecretMockPass')&&!result.out.includes('mock-session')&&!result.out.includes('example@local.test'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
function resolvePath(...segments){return resolve(...segments);}
