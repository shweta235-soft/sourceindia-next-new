/** QA guard checks only: never sends a valid write, no uploads or DB mutations. */
import assert from 'node:assert/strict';
const host=process.env.BULK139_URL||'http://localhost:3000';
const tasks=[['POST','/v2/api/home_banners'],['PUT','/v2/api/home_banners/1'],['DELETE','/v2/api/home_banners/1']];
let pass=0;
for(const [method,path] of tasks){
 const res=await fetch(host+path,{method,signal:AbortSignal.timeout(15000)});
 assert.equal(res.status,403,`${method} ${path} expected 403; got ${res.status}`);
 console.log('PASS anonymous denied',method,path,res.status);pass++;
}
const img=await fetch(host+'/upload/home_banners/00000000-0000-4000-8000-000000000000.png',{signal:AbortSignal.timeout(15000)});
assert.equal(img.status,404);pass++;
console.log('PASS missing QA image returns',img.status);
console.log(`BULK139 SAFE HTTP PASS=${pass} FAIL=0 TOTAL=${pass}`);
