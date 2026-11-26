import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
test('Bulk109 GET-only signed Admin client validates all seven mock modules without credentials in output',async()=>{
 const server=createServer(async(req,res)=>{
  const path=new URL(req.url||'/','http://localhost');
  const authed=(req.headers.cookie||'').includes('mock-session');
  let status=401,body={message:'Admin session required.'};
  if(path.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){body={destination:'/admin/dashboard'};res.setHeader('Set-Cookie','si_admin_session=mock-session; Path=/admin; HttpOnly; SameSite=Lax');}
   else body={success:true};
  }else if(path.pathname==='/admin/session-status'&&authed){status=200;body={authenticated:true};}
  else if(path.pathname.startsWith('/admin/api/local/')&&authed){
   const suffix=path.pathname.split('/');status=200;
   if(path.searchParams.get('sortBy')==='password'||path.searchParams.get('page')==='0'||suffix.at(-1)==='invalid-id'){status=400;body={message:'Invalid request.'};}
   else if(suffix.at(-1)==='count'||suffix.at(-1)==='summary')body={total:1};
   else if(suffix.at(-1)==='server-side'||suffix.at(-1)==='filtered')body={data:[{id:1}],totalRecords:1,filteredRecords:1};
   else if(/^\d+$/.test(suffix.at(-1)))body={item:{id:1}};
   else body={items:[{id:1}],page:1,limit:1};
  }
  res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const port=server.address().port;
  const output=await new Promise((done,reject)=>{
   const child=spawn(process.execPath,[resolve(import.meta.dirname,'test-local-bulk109-auth.mjs')],{env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:['pipe','pipe','pipe']});
   let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
   child.on('error',reject);child.on('close',code=>done({code,stdout,stderr}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'private-test@example.invalid',password:'very-secret-password'})).toString('base64'));
  });
  assert.equal(output.code,0,output.stdout+'\n'+output.stderr);
  assert.match(output.stdout,/BULK109 AUTH READ RESULTS: PASS=67 FAIL=0 SKIP=0 TOTAL=67/);
  for(const word of ['private-test@example.invalid','very-secret-password','mock-session'])assert.ok(!output.stdout.includes(word));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
