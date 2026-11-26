/** Bulk115 local HTTP GET-only smoke. Admin calls verify denied (401) without credentials. */
const BASE=process.env.BULK115_URL||'http://localhost:3000';
const checks=[
 ['/v2/api/location/countries',200],
 ['/v2/api/location/states',200],
 ['/v2/api/location/cities',200],
 ['/v2/api/location/states/101',200],
 ['/v2/api/location/cities/1',200],
 ['/v2/api/location/pincode/not-a-pin',400],
 ['/admin/api/local/product-categories/product-bar-graph',401],
 ['/admin/api/local/item-categories/getitem',401],
 ['/admin/api/local/product-keywords/by-subcategory/1',401],
 ['/admin/api/local/faqs/server-side',401],
];
let pass=0,fail=0;
for(const [path,expect] of checks){
 try{
  const res=await fetch(new URL(path,BASE),{method:'GET',headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(15000)});
  const payload=await res.text();
  const actual=res.status,valid=actual===expect;
  console.log(`${valid?'PASS':'FAIL'} ${actual} (expected ${expect}) GET ${path}${!valid?' : '+payload.slice(0,130):''}`);
  if(valid)pass++;else fail++;
 }catch(e){fail++;console.log('FAIL HTTP0 GET '+path+' '+(e?.cause?.code||e?.name||'network error'));}
}
console.log(`BULK115 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Only GET used; Admin 401 guard checks are not authenticated DB contract tests.');
if(fail)process.exitCode=1;
