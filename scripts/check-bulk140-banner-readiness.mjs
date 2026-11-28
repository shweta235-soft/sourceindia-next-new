/** BULK140 QA readiness preflight. Read-only: no DB connection, HTTP calls, or writes. */
import {isAbsolute,resolve,parse} from 'node:path';
import {existsSync} from 'node:fs';
const noSecret=(name)=>typeof process.env[name]==='string'&&process.env[name].length>0;
const checks=[
 ['Explicit QA flag',process.env.SOURCEINDIA_BANNERS_QA_WRITES_ENABLED==='1'],
 ['Not production',process.env.NODE_ENV!=='production'],
 ['Local QA database host',['localhost','127.0.0.1','::1'].includes((process.env.DB_HOST??'').toLowerCase())],
 ['Distinct QA DB name',noSecret('SOURCEINDIA_BANNERS_QA_DB_NAME')&&process.env.DB_NAME===process.env.SOURCEINDIA_BANNERS_QA_DB_NAME&&/(qa|test|sandbox)/i.test(process.env.DB_NAME??'')],
 ['QA bearer token (32+ characters)',(process.env.SOURCEINDIA_BANNERS_QA_TOKEN??'').length>=32],
 ['QA-only absolute storage root',(()=>{const p=process.env.SOURCEINDIA_BANNERS_QA_STORAGE_ROOT??'';if(!p||!isAbsolute(p))return false;const abs=resolve(p);return /(^|[\\/])(qa|test|sandbox)([\\/]|$)/i.test(abs)&&![resolve('.'),resolve('upload'),resolve('public'),resolve('..')].includes(abs);})()],
];
let fail=0;
for(const [label,ok] of checks){console.log(`${ok?'PASS':'NOT READY'} ${label}`);if(!ok)fail++;}
console.log(`BULK140 QA READINESS ${fail?'NOT READY':'READY'} (${checks.length-fail}/${checks.length})`);
console.log('PRECHECK ONLY. No DB connection, upload, create, update, or delete performed.');
console.log('READY is not proof of DB isolation or write parity; manually verify independent QA database/storage before authorized tests.');
if(fail)process.exitCode=2;
