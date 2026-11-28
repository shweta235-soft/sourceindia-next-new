/** BULK141: never sends an authorized mutation. */
const host=process.env.BULK141_URL||'http://localhost:3000';
const cases=[['POST','/v2/api/membership_plan'],['PUT','/v2/api/membership_plan/1'],['DELETE','/v2/api/membership_plan/1'],['DELETE','/v2/api/membership_plan/delete-selected'],['PATCH','/v2/api/membership_plan/1/status'],['PATCH','/v2/api/membership_plan/1/delete_status']];
let pass=0,fail=0;
for(const [method,path] of cases){try{
 const response=await fetch(host+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'probe',status:1,ids:[1]}) ,signal:AbortSignal.timeout(15000)});
 if(response.status===403){console.log('PASS anonymous mutation denied',method,path,403);pass++;}
 else{console.log('FAIL unexpected status',method,path,response.status);fail++;}
}catch(e){console.log('FAIL connection',method,path,e.cause?.code||e.name);fail++;}}
console.log(`BULK141 SAFE HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${cases.length}`);
if(fail)process.exitCode=1;
