/** BULK137 safe HTTP checks. Intentionally sends NO authorized mutations. */
const origin=(process.env.SOURCEINDIA_NEXT_BASE_URL||'http://localhost:3000').replace(/\/$/,'');
let pass=0,fail=0;
for(const route of ['/v2/api/settings/site','/v2/api/settings/home']){
 const form=new FormData();form.append('probe','not-authorized');
 try{
  const response=await fetch(origin+route,{method:'PUT',body:form,signal:AbortSignal.timeout(15000)});
  if(response.status===403||response.status===401){console.log('PASS anonymous PUT denied',route,response.status);pass++;}
  else{console.error('FAIL anonymous PUT should be denied',route,response.status);fail++;}
 }catch(error){console.error('ERROR',route,error.message);fail++;}
}
const fake='a1b2c3d4-e5f6-4abc-8def-1234567890ab.png';
try{
 const response=await fetch(`${origin}/upload/siteSettings/${fake}`,{signal:AbortSignal.timeout(15000)});
 if(response.status===404){console.log('PASS missing QA image returns 404');pass++;}
 else{console.error('FAIL missing QA image',response.status);fail++;}
}catch(error){console.error('ERROR QA image',error.message);fail++;}
console.log(`BULK137 SAFE HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
if(fail)process.exitCode=1;
