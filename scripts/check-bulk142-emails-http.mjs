/** BULK142 safe unauthorized mutation probes. Never supplies QA authorization. */
const host=process.env.BULK142_URL||'http://localhost:3000';
const cases=[['POST','/v2/api/emails'],['POST','/v2/api/emails/clone'],['PUT','/v2/api/emails/1'],['DELETE','/v2/api/emails/1']];
let pass=0,fail=0;for(const [method,path] of cases){try{const r=await fetch(host+path,{method,headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});if(r.status===403){console.log('PASS anonymous denied',method,path,403);pass++;}else{console.log('FAIL unexpected status',method,path,r.status);fail++;}}catch(e){console.log('FAIL connection',method,path,e.cause?.code||e.name);fail++;}}
console.log(`BULK142 SAFE HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${cases.length}`);if(fail)process.exitCode=1;
