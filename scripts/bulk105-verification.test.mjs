import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {ADMIN_READ_RESOURCES,ADMIN_COUNT_RESOURCES,ADMIN_SERVER_SIDE_RESOURCES,adminReadChecks,validJsonContract} from './bulk105-contracts.mjs';
import {BULK105_TABLES,schemaDiff} from './bulk105-schema.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(join(root,name),'utf8');
test('15 authenticated read resources correspond to actual GET routes',()=>{
 assert.equal(ADMIN_READ_RESOURCES.length,15);
 for(const resource of ADMIN_READ_RESOURCES){
  const route=`src/app/admin/api/local/${resource}/route.ts`;
  assert.ok(existsSync(join(root,route)),route);
  assert.match(read(route),/export async function GET\(/);
 }
});
test('count and server-side resources exist and expose GET',()=>{
 assert.equal(ADMIN_COUNT_RESOURCES.length,14);
 assert.equal(ADMIN_SERVER_SIDE_RESOURCES.length,8);
 for(const resource of ADMIN_COUNT_RESOURCES){
  const path=`src/app/admin/api/local/${resource}/count/route.ts`;
  assert.match(read(path),/export async function GET\(/);
 }
 for(const resource of ADMIN_SERVER_SIDE_RESOURCES){
  const path=`src/app/admin/api/local/${resource}/server-side/route.ts`;
  assert.match(read(path),/export async function GET\(/);
 }
});
test('authenticated checks cover list, count, pagination, invalid ID and specialized reads',()=>{
 const checks=adminReadChecks();
 assert.equal(checks.length,56);
 assert.equal(new Set(checks.map(x=>x.path)).size,checks.length);
 assert.ok(checks.some(x=>x.path.includes('/activities/coreactivity/1')));
 assert.ok(checks.every(x=>x.path.startsWith('/admin/api/local/')));
 assert.ok(checks.every(x=>(x.status??200)===200||x.status===400));
});
test('contract validator requires expected JSON types',()=>{
 assert.equal(validJsonContract({field:'items'},{items:[]}),true);
 assert.equal(validJsonContract({field:'items'},{items:{}}),false);
 assert.equal(validJsonContract({field:'total'},{total:0}),true);
 assert.equal(validJsonContract({field:'total'},{total:-1}),false);
 assert.equal(validJsonContract({field:'data'},{data:[]}),true);
 assert.equal(validJsonContract({field:'data'},{data:null}),false);
});
test('schema preflight has distinct audited table dependencies and detects missing columns',()=>{
 assert.equal(Object.keys(BULK105_TABLES).length,19);
 for(const [table,cols] of Object.entries(BULK105_TABLES)){
  assert.match(table,/^[a-z_]+$/);
  assert.ok(cols.length>=2);
  assert.equal(new Set(cols).size,cols.length);
  assert.ok(cols.every(c=>/^[a-z_]+$/.test(c)),table);
 }
 assert.deepEqual(schemaDiff(['a','b','c'],new Set(['a','c'])),['b']);
 assert.deepEqual(schemaDiff(['a'],new Set(['a'])),[]);
});
test('verification commands are explicitly read-only, local-only and do not save secrets',()=>{
 const js=read('scripts/test-local-bulk105-auth.mjs');
 assert.match(js,/localhost/);
 assert.match(js,/method='GET'/);
 assert.match(js,/CSRF blocked/);
 assert.doesNotMatch(js,/console\.(log|error)\([^\n]*(?:password|cookieHeader)\)/);
 const preflight=read('scripts/test-local-bulk105-db-preflight.mjs');
 assert.match(preflight,/INFORMATION_SCHEMA\.COLUMNS/);
 assert.doesNotMatch(preflight,/\b(?:INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM|DROP TABLE)\b/i);
 const ps=read('scripts/test-local-bulk105-auth.ps1');
 assert.match(ps,/Read-Host .* -AsSecureString/);
 assert.match(ps,/RedirectStandardInput=\$true/);
});

test('authenticated HTTP harness runs full 67-check suite against local mock without disclosing credentials', async()=>{
 const http=await import('node:http');
 const cp=await import('node:child_process');
 const {once}=await import('node:events');
 const server=http.createServer((req,res)=>{
  const path=req.url.split('?')[0];
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  const reply=(code,payload,cookie)=>{
   res.statusCode=code;
   if(cookie)res.setHeader('Set-Cookie',cookie);
   res.end(JSON.stringify(payload));
  };
  if(path==='/api/admin-session'&&req.method==='POST')return reply(200,{destination:'/admin/dashboard'},'si_admin_session=test123.sig; Path=/admin; HttpOnly');
  if(path==='/api/admin-session'&&req.method==='DELETE')return reply(200,{success:true});
  if(path==='/admin/session-status')return reply(200,{authenticated:true});
  if(!req.headers.cookie)return reply(401,{message:'Admin session required.'});
  if(req.method==='POST'&&req.headers.origin==='https://evil.example')return reply(403,{message:'Origin not allowed.'});
  if(path.endsWith('/invalid'))return reply(400,{message:'Invalid ID.'});
  if(path.endsWith('/count'))return reply(200,{total:0});
  if(path.endsWith('/server-side'))return reply(200,{data:[]});
  return reply(200,{items:[]});
 });
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const port=server.address().port;
  const child=cp.spawn(process.execPath,[join(root,'scripts/test-local-bulk105-auth.mjs')],{
   env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.on('data',c=>stdout+=c.toString());
  child.stderr.on('data',c=>stderr+=c.toString());
  child.stdin.end(Buffer.from(JSON.stringify({email:'mock-admin@example.invalid',password:'mock-private-password'})).toString('base64'));
  const [code]=await once(child,'close');
  assert.equal(code,0,stderr+'\n'+stdout);
  assert.match(stdout,/BULK105 AUTH READ RESULTS: PASS=67 FAIL=0 TOTAL=67/);
  assert.doesNotMatch(stdout+stderr,/mock-admin@example.invalid|mock-private-password|test123\.sig/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
