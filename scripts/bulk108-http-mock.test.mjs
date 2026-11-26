import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
test('Bulk108 signed Admin HTTP probes are read-only and do not expose credentials',async()=>{
 const server=createServer(async(req,res)=>{
  const u=new URL(req.url||'/','http://localhost');
  const cookie=(req.headers.cookie||'').includes('mock-session');
  let status=401,body={message:'Admin session required.'};
  if(u.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){
    body={destination:'/admin/dashboard'};
    res.setHeader('Set-Cookie','si_admin_session=mock-session; Path=/admin; HttpOnly; SameSite=Lax');
   }else body={success:true};
  }else if(u.pathname==='/admin/session-status'&&cookie){status=200;body={authenticated:true};}
  else if(u.pathname.startsWith('/admin/api/local/')&&cookie){
   if(req.method==='GET'){
    status=200;
    body=u.pathname.includes('/server-side')||u.pathname.includes('category-conflict-logs')?{data:[],totalRecords:0,filteredRecords:0}:u.pathname.includes('newsletter-histories/count')?{all:0}:u.pathname.includes('user-activity/user_id')?{user_activity:[]}:u.pathname.endsWith('/count')?{total:0}:{items:[]};
   }else if(req.headers.origin==='https://invalid.example'){
    status=403;body={message:'Origin mismatch.'};
   }else{status=503;body={message:'Writes disabled.'};}
  }
  res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const port=server.address().port;
  const result=await new Promise((resolvePromise,reject)=>{
   const child=spawn(process.execPath,[resolve(import.meta.dirname,'test-local-bulk108-auth.mjs')],{env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:['pipe','pipe','pipe']});
   let stdout='',stderr='';
   child.stdout.on('data',x=>stdout+=x.toString());
   child.stderr.on('data',x=>stderr+=x.toString());
   child.on('error',reject);
   child.on('close',code=>resolvePromise({code,stdout,stderr}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'private@example.org',password:'verySecret'})).toString('base64'));
  });
  assert.equal(result.code,0,result.stdout+'\n'+result.stderr);
  assert.match(result.stdout,/BULK108 AUTH SAFE RESULTS: PASS=52 FAIL=0 TOTAL=52/);
  assert.ok(!result.stdout.includes('private@example.org')&&!result.stdout.includes('verySecret')&&!result.stdout.includes('mock-session'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
