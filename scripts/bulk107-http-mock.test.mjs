import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
test('Bulk107 92 nonmutating client probes succeed against local mock and do not print credentials',async()=>{
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url||'/','http://localhost');
  const cookie=(req.headers.cookie||'').includes('mock-session');
  let status=401,body={message:'Admin session required.'};
  if(url.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){
    body={destination:'/admin/dashboard'};
    res.setHeader('Set-Cookie','si_admin_session=mock-session; Path=/admin; HttpOnly; SameSite=Lax');
   }else body={success:true};
  }else if(url.pathname==='/admin/session-status'&&cookie){status=200;body={authenticated:true};}
  else if(url.pathname.startsWith('/admin/api/local/')&&cookie){
   if(req.method==='GET'){status=200;body={items:[],page:1,limit:20};}
   else if(req.headers.origin==='https://invalid.example'){status=403;body={message:'Origin not allowed.'};}
   else {status=503;body={message:'Writes disabled.'};}
  }
  res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));
 });
 await new Promise(res=>server.listen(0,'127.0.0.1',res));
 const port=server.address().port;
 try{
  const output=await new Promise((resolvePromise,reject)=>{
   const child=spawn(process.execPath,[resolve(import.meta.dirname,'test-local-bulk107-auth.mjs')],{env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:['pipe','pipe','pipe']});
   let out='',err='';
   child.stdout.on('data',x=>out+=x.toString());child.stderr.on('data',x=>err+=x.toString());
   child.on('error',reject);child.on('close',code=>resolvePromise({code,out,err}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'secret@local.test',password:'secretExamplePassword'})).toString('base64'));
  });
  assert.equal(output.code,0,output.out+'\n'+output.err);
  assert.match(output.out,/BULK107 AUTH SAFE RESULTS: PASS=92 FAIL=0 TOTAL=92/);
  assert.ok(!output.out.includes('secret@local.test')&&!output.out.includes('secretExamplePassword')&&!output.out.includes('mock-session'));
 }finally{await new Promise(res=>server.close(res));}
});
