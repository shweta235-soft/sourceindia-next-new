/** Requires local Next server plus DB. No writes. Tests public endpoints only. */
const BASE=process.env.BULK116_URL||'http://localhost:3000';
const checks=[
 ['/v2/api/products/all-products',400],
 ['/v2/api/products/all-products?company_id=abc',422],
 ['/v2/api/products/all-products?company_id=1',200],
 ['/v2/api/products/?limit=2&is_front=1',200],
 ['/v2/api/products/?is_approve=0',400],
 // Both URL spellings should reach the GET handler directly, not via HTTP 308.
 ['/v2/api/products?limit=2&is_front=1',200],
 ['/v2/api/products?is_approve=0',400],
 ['/v2/api/products/latest-home',200],
 ['/v2/api/products/latest-home?unknown=1',400],
 ['/v2/api/products/suggest?query=a',200],
 ['/v2/api/products/suggest?query=electronics',200],
 ['/v2/api/products/filtered?limit=2',200],
 ['/v2/api/products/companies?limit=2',200],
 ['/v2/api/products/companies?is_delete=1',400],
 ['/v2/api/products/companies/-1',400],
 ['/v2/api/products/details/-1',400],
 ];
let pass=0,fail=0;
for(const [path,expected] of checks){
 try{
  const res=await fetch(new URL(path,BASE),{method:'GET',redirect:'manual',headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
  const contentType=res.headers.get('content-type')||'';
  const actual=res.status;
  const valid=actual===expected&&contentType.includes('application/json');
  console.log(`${valid?'PASS':'FAIL'} GET ${path} => ${actual}, expected ${expected}`);
  if(valid)pass++;else fail++;
 }catch(e){fail++;console.log('FAIL GET '+path+' '+(e?.cause?.code||e?.name||'NETWORK_ERROR'));}
}
console.log(`BULK116 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('GET-only smoke: data shape/parity still needs comparison with original Express and real MySQL.');
if(fail)process.exitCode=1;
