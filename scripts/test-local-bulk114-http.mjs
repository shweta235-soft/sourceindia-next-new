/** Public read-only GETs against a RUNNING local Next server; 400/200/503 tolerated per DB readiness.
 * Exact results depend on local catalog data; report status, no writes or credentials.
 */
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const routes=[
 '/api/local/catalog/subcategories?limit=2',
 '/api/local/catalog/item-categories?limit=2',
 '/api/local/catalog/item-categories/count',
 '/api/local/catalog/item-categories/by-id/999999999',
 '/api/local/catalog/item-subcategories?limit=2',
 '/api/local/catalog/item-subcategories/count',
 '/api/local/catalog/items?limit=2',
 '/api/local/catalog/items/count',
 '/api/local/catalog/product-keywords?limit=2',
 '/api/local/catalog/product-keywords/count',
 '/api/local/catalog/taxonomy/summary',
 '/api/local/catalog/taxonomy/search?q=electronic',
 '/api/local/catalog/items?limit=0',
 '/api/local/catalog/items/by-hierarchy/1/1/1/1?limit=2'
];
let pass=0,fail=0;
for(const path of routes){
 const expect400=path.includes('limit=0');
 try{
  const r=await fetch(base+path,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
  const json=await r.json();
  const okay=expect400?r.status===400:r.status===200||r.status===404;
  if(okay){pass++;console.log(`PASS ${path}: HTTP ${r.status}`);}else{fail++;console.log(`FAIL ${path}: HTTP ${r.status} ${String(json?.message||'').slice(0,90)}`);}
 }catch(e){fail++;console.log(`FAIL ${path}: connection/invalid JSON (${e?.name||'error'})`);}
}
console.log(`BULK114 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
if(fail)process.exitCode=1;
