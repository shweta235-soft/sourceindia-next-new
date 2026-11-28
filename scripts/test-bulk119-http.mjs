/** GET-only localhost smoke for BULK119 native routes. Does not establish parity. */
const BASE=process.env.BULK119_URL||'http://localhost:3000';
const checks=[
 ["/v2/api/faqs",200,'array'],
 ["/v2/api/faqs/count",200,'faq-count'],
 ["/v2/api/faqs/server-side?page=1&limit=2",200,'grid'],
 ["/v2/api/faqs/-1",400,'object'],
 ["/v2/api/faqs/999999999999999",404,'object'],
 ["/v2/api/seo_pages",200,'array'],
 ["/v2/api/seo_pages/count",200,'total'],
 ["/v2/api/seo_pages/server-side?page=1&limit=2",200,'grid'],
 ["/v2/api/seo_pages/slug/nonexistent-bulk119-parity-slug",404,'object'],
 ["/v2/api/seo_pages/999999999999999",404,'object'],
 ["/v2/api/testimonials",200,'array'],
 ["/v2/api/testimonials/count",200,'total'],
 ["/v2/api/testimonials/server-side?page=1&limit=2",200,'grid'],
 ["/v2/api/testimonials/999999999999999",404,'object'],
 ["/v2/api/roles",200,'array'],
 ["/v2/api/roles/server-side?page=1&limit=2",200,'grid'],
 ["/v2/api/roles/999999999999999",404,'object'],
 ["/v2/api/pages/999999999999999",404,'object'],
 ["/v2/api/faqs/server-side?limit=50000",400,'object'],
 ["/v2/api/roles/server-side?sortBy=name%20DESC%3BDELETE%20FROM%20roles",200,'grid'],
];
let pass=0,fail=0;
for(const [path,status,shape] of checks){
 try{
  const res=await fetch(new URL(path,BASE),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(15000)});
  const body=await res.json();
  const matchShape=shape==='array'?Array.isArray(body):shape==='grid'?Array.isArray(body?.data)&&Number.isInteger(body?.totalRecords)&&Number.isInteger(body?.filteredRecords):shape==='total'?Number.isInteger(body?.total):shape==='faq-count'?Number.isInteger(body?.faq)&&Number.isInteger(body?.faqCategory):!Array.isArray(body)&&typeof body==='object'&&body!==null;
  const ok=res.status===status&&matchShape;if(ok)pass++;else fail++;
  console.log(`${ok?'PASS':'FAIL'} GET ${path} => ${res.status}, expected ${status}, ${shape}`);
 }catch(e){fail++;console.log(`FAIL GET ${path} ${e?.cause?.code||e?.name||'UNKNOWN'}`);}
}
console.log(`BULK119 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Native GET smoke only. Compare Express responses separately.');
if(fail)process.exitCode=1;
