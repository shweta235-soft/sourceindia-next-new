/** Requires locally running Next.js server and connected local DB; GET only. */
const BASE=process.env.BULK118_URL||'http://localhost:3000';
const checks=[
 ['/v2/api/activities',200,'array'],
 ['/v2/api/activities?status=1&is_delete=0',200,'array'],
 ['/v2/api/activities/count',200,'activity-count'],
 ['/v2/api/activities/server-side?page=1&limit=2',200,'grid'],
 ['/v2/api/activities/coreactivity/1',200,'array'],
 ['/v2/api/core_activities',200,'array'],
 ['/v2/api/core_activities?is_delete=0',200,'array'],
 ['/v2/api/core_activities/count',200,'core-count'],
 ['/v2/api/core_activities/colors',200,'array'],
 ['/v2/api/core_activities/server-side?page=1&limit=2',200,'grid'],
 ['/v2/api/faq_categories',200,'array'],
 ['/v2/api/faq_categories?all=1',200,'array'],
 ['/v2/api/faq_categories/server-side?page=1&limit=2',200,'grid'],
 ['/v2/api/faqcategories',200,'array'],
 ['/v2/api/faqcategories/server-side?page=1&limit=2',200,'grid'],
 ['/v2/api/activities?status=bad',400,'object'],
 ['/v2/api/core_activities?is_delete=3',400,'object'],
 ['/v2/api/activities/-1',400,'object'],
 ['/v2/api/core_activities/-1',400,'object'],
 ['/v2/api/faq_categories/-1',400,'object'],
 ['/v2/api/faqcategories/-1',400,'object'],
 ['/v2/api/activities/999999999999999',404,'object'],
 ['/v2/api/core_activities/999999999999999',404,'object'],
 ['/v2/api/faq_categories/999999999999999',404,'object'],
];
let pass=0,fail=0;
for(const [path,expected,shape] of checks){
 try{
  const res=await fetch(new URL(path,BASE),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(15000)});
  const json=await res.json();
  const okayShape=shape==='array'?Array.isArray(json):shape==='activity-count'?Number.isInteger(json?.activities)&&Number.isInteger(json?.coreActivities):shape==='core-count'?Number.isInteger(json?.total):shape==='grid'?Array.isArray(json?.data)&&Number.isInteger(json?.totalRecords)&&Number.isInteger(json?.filteredRecords):!Array.isArray(json)&&typeof json==='object'&&json!==null;
  const okay=res.status===expected&&okayShape;
  console.log(`${okay?'PASS':'FAIL'} GET ${path} => ${res.status}, expected ${expected}; shape=${shape}`);
  if(okay)pass++;else fail++;
 }catch(error){fail++;console.log(`FAIL GET ${path} ${error?.cause?.code||error?.name||'NETWORK_ERROR'}`);}
}
console.log(`BULK118 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only native GET smoke; does not establish exact production Express parity.');
if(fail)process.exitCode=1;
