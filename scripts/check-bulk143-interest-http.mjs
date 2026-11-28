/** Only non-destructive unauthorized probes; never uses production auth. */
const base=process.env.BULK143_URL||'http://localhost:3000',prefix='/v2/api/interest_categories';
const probes=[['POST',prefix],['PUT',prefix+'/1'],['DELETE',prefix+'/1'],['PATCH',prefix+'/1/status']];
let pass=0,fail=0;for(const [method,path] of probes){try{const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(12000)});if(response.status===403){pass++;console.log('PASS anonymous denied',method,path,403);}else{fail++;console.log('FAIL',method,path,response.status);}}catch(e){fail++;console.log('ERROR',method,path,e.cause?.code||e.name);}}
console.log(`BULK143 SAFE HTTP PASS=${pass} FAIL=${fail} TOTAL=${probes.length}`);if(fail)process.exitCode=1;
