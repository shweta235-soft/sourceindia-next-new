/** Anonymous-only HTTP security probes; no authorized mutations. */
const base=process.env.BULK144_URL||'http://localhost:3000',prefix='/v2/api/interest_sub_categories';
const tests=[['POST',prefix],['PUT',prefix+'/1'],['DELETE',prefix+'/1'],['DELETE',prefix+'/delete-selected'],['PATCH',prefix+'/1/status']];
let pass=0,fail=0;for(const [method,path] of tests){try{const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(12000)});if(response.status===403){pass++;console.log('PASS anonymous denied',method,path,403);}else{fail++;console.log('FAIL',method,path,response.status);}}catch(e){fail++;console.log('ERROR',method,path,e.cause?.code||e.name);}}
console.log(`BULK144 SAFE HTTP PASS=${pass} FAIL=${fail} TOTAL=${tests.length}`);if(fail)process.exitCode=1;
