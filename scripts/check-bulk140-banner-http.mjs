/** BULK140: anonymous write-denial regression. NEVER uses valid auth or uploaded files. */
import assert from 'node:assert/strict';
const base=process.env.BULK140_URL||'http://localhost:3000';
const cases=[
 ['POST','/v2/api/home_banners'],
 ['PUT','/v2/api/home_banners/1'],
 ['DELETE','/v2/api/home_banners/1'],
 ['PATCH','/v2/api/home_banners/1/status'],
 ['PATCH','/v2/api/home_banners/1/delete_status'],
 ['DELETE','/v2/api/home_banners/delete-selected'],
];
let pass=0,fail=0;
for(const [method,path] of cases){
 try{
  const response=await fetch(base+path,{method,redirect:'manual',signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,403,`${method} ${path}: expected 403, got ${response.status}`);
  console.log('PASS unauthorized mutation denied',method,path,response.status);pass++;
 }catch(err){console.error('FAIL',method,path,err.message);fail++;}
}
console.log(`BULK140 SAFE HTTP PASS=${pass} FAIL=${fail} TOTAL=${cases.length}`);
if(fail)process.exitCode=1;
