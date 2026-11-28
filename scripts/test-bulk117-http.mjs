/** Read-only HTTP smoke; requires `npm run dev` and installed original dependencies. */
const base=process.env.BULK117_BASE_URL||'http://localhost:3000';
const checks=[
 ['/v2/api/no-such-module-bulk117',404],
 ['/v2/api/sellers/sendmail-cron',403],
 ['/v2/api/products/product-keyword-update',403],
 ['/v2/api/users/insert-from-company',403],
 ['/v2/api/tickets/support-ticket/track/5',403],
 ['/v2/api/seller_mail_histories/track-open/secret',403],
];
let pass=0,fail=0;
for(const [path,expected] of checks){
 try{
  const res=await fetch(`${base}${path}`,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  const status=res.status;console.log(`${status===expected?'PASS':'FAIL'} GET ${path} => ${status}, expected ${expected}`);
  if(status===expected)pass++;else fail++;
 }catch(e){console.log(`FAIL GET ${path} ${e.cause?.code||e.message}`);fail++;}
}
console.log(`BULK117 LOCAL HTTP RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${checks.length}`);
console.log('This is a transport/auth-gate smoke test, NOT full 516-route Express functional parity.');
if(fail)process.exitCode=1;
