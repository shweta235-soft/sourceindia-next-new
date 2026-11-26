import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

test('Bulk109 Admin client identifies failing endpoint/stage/error code without exposing credentials or rows',async()=>{
 const server=createServer((req,res)=>{
  const path=new URL(req.url||'/','http://localhost');
  const authed=(req.headers.cookie||'').includes('diagnostic-session');
  let status=401,body={message:'Admin session required.'};
  if(path.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){
    body={destination:'/admin/dashboard'};
    res.setHeader('set-cookie','si_admin_session=diagnostic-session; Path=/admin; HttpOnly; SameSite=Lax');
   }else body={success:true};
  }else if(path.pathname==='/admin/session-status'&&authed){status=200;body={authenticated:true};}
  else if(path.pathname.startsWith('/admin/api/local/')&&authed){
   const kind=path.pathname.split('/')[4];
   const suffix=path.pathname.split('/').at(-1);
   status=200;
   if(path.searchParams.get('sortBy')==='password'||path.searchParams.get('page')==='0'||suffix==='invalid-id'){
    status=400;body={message:'Invalid request.'};
   }else if(kind==='enquiries' && path.pathname==='/admin/api/local/enquiries'){
    status=503;body={message:'Unavailable',diagnostic:{kind,action:'list',stage:'listing',code:'ER_BAD_FIELD_ERROR'}};
   }else if(kind==='buyers' && suffix==='summary'){
    status=503;body={message:'Unavailable',diagnostic:{kind,action:'summary',stage:'summary',code:'ER_PARSE_ERROR'}};
   }else if(kind==='tickets' && /^\d+$/.test(suffix)){
    status=503;body={message:'Unavailable',diagnostic:{kind,action:'detail',stage:'ticket-replies',code:'ER_NO_SUCH_TABLE'}};
   }else if(suffix==='count'||suffix==='summary')body={total:1};
   else if(suffix==='server-side'||suffix==='filtered')body={data:[{id:1}],totalRecords:1,filteredRecords:1};
   else if(/^\d+$/.test(suffix))body={item:{id:1}};
   else body={items:[{id:1}],page:1,limit:1};
  }
  res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const output=await new Promise((done,reject)=>{
   const child=spawn(process.execPath,[resolve(import.meta.dirname,'test-local-bulk109-auth.mjs')],{
    env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${server.address().port}`},stdio:['pipe','pipe','pipe']
   });
   let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
   child.on('error',reject);child.on('close',code=>done({code,stdout,stderr}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'secret@example.invalid',password:'secret-password'})).toString('base64'));
  });
  assert.equal(output.code,1);
  assert.match(output.stdout,/SAFE DIAG enquiries:list: reason=ER_BAD_FIELD_ERROR; stage=listing/);
  assert.match(output.stdout,/SAFE DIAG buyers:summary: reason=ER_PARSE_ERROR; stage=summary/);
  assert.match(output.stdout,/SAFE DIAG tickets:live detail: reason=ER_NO_SUCH_TABLE; stage=ticket-replies/);
  assert.match(output.stdout,/AUTH READ RESULTS: PASS=\d+ FAIL=3/);
  for(const word of ['secret@example.invalid','secret-password','diagnostic-session','SELECT ','INSERT ','USER_PASSWORD'])assert.ok(!output.stdout.includes(word),word);
 }finally{await new Promise(r=>server.close(r));}
});

test('Bulk109 diagnostic retains HTTP 200 when a server returns invalid JSON',async()=>{
 const server=createServer((req,res)=>{
  const path=new URL(req.url||'/','http://localhost');
  let status=401,body={message:'Admin session required.'};
  const authed=(req.headers.cookie||'').includes('diagnostic-session');
  if(path.pathname==='/api/admin-session'){
   status=200;
   if(req.method==='POST'){
    body={destination:'/admin/dashboard'};
    res.setHeader('set-cookie','si_admin_session=diagnostic-session; Path=/admin; HttpOnly; SameSite=Lax');
   }else body={success:true};
  }else if(path.pathname==='/admin/session-status'&&authed){status=200;body={authenticated:true};}
  else if(path.pathname.startsWith('/admin/api/local/')&&authed){
   const suffix=path.pathname.split('/').at(-1);status=200;
   if(path.searchParams.get('sortBy')==='password'||path.searchParams.get('page')==='0'||suffix==='invalid-id'){
    status=400;body={message:'Invalid request.'};
   }else if(path.pathname==='/admin/api/local/sellers/server-side'){
    res.writeHead(200,{'content-type':'application/json'});res.end('{ broken json');return;
   }else if(suffix==='count'||suffix==='summary')body={total:1};
   else if(suffix==='server-side'||suffix==='filtered')body={data:[{id:1}],totalRecords:1,filteredRecords:1};
   else if(/^\d+$/.test(suffix))body={item:{id:1}};
   else body={items:[{id:1}],page:1,limit:1};
  }
  res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const output=await new Promise((done,reject)=>{
   const child=spawn(process.execPath,[resolve(import.meta.dirname,'test-local-bulk109-auth.mjs')],{
    env:{...process.env,LOCAL_TEST_BASE_URL:`http://127.0.0.1:${server.address().port}`},stdio:['pipe','pipe','pipe']
   });
   let stdout='';child.stdout.on('data',x=>stdout+=x);child.on('error',reject);
   child.on('close',code=>done({code,stdout}));
   child.stdin.end(Buffer.from(JSON.stringify({email:'secret@example.invalid',password:'secret-password'})).toString('base64'));
  });
  assert.equal(output.code,1);
  assert.match(output.stdout,/FAIL sellers:server-side: HTTP=200 expected=200/);
  assert.match(output.stdout,/SAFE DIAG sellers:server-side: reason=JSON_PARSE_ERROR; stage=json-parse/);
  assert.match(output.stdout,/BULK109 AUTH READ RESULTS: PASS=\d+ FAIL=1/);
  assert.ok(!output.stdout.includes('secret-password'));
 }finally{await new Promise(r=>server.close(r));}
});
