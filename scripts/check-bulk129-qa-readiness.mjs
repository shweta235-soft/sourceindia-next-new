/** BULK129: read-only isolated-QA readiness check. NEVER executes writes, mail or files. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!process.env.DB_NAME){try{process.loadEnvFile('.env.local');}catch{/* absent local config */}}
const e=process.env;
const problems=[];
const isLocal=['localhost','127.0.0.1','::1'].includes((e.DB_HOST||'').toLowerCase());
if(!isLocal)problems.push('DB_HOST must be localhost/127.0.0.1');
const name=e.DB_NAME||'';
if(!/(?:qa|test|sandbox)/i.test(name))problems.push('DB_NAME must identify isolated QA/test/sandbox database');
if(name!==e.SOURCEINDIA_CONTACT_QA_DB_NAME||name!==e.SOURCEINDIA_FRONT_MENU_QA_DB_NAME)problems.push('Contact/Menu QA DB names must both equal DB_NAME');
if(e.NODE_ENV==='production')problems.push('NODE_ENV cannot be production');
if(e.SOURCEINDIA_CONTACT_WRITES_ENABLED!=='1'||e.SOURCEINDIA_FRONT_MENU_WRITES_ENABLED!=='1')problems.push('QA write flags are not both enabled');
for(const key of ['SOURCEINDIA_CONTACT_QA_TOKEN','SOURCEINDIA_FRONT_MENU_QA_TOKEN'])if((e[key]||'').length<32)problems.push(`${key} missing or too short`);
const admin=(e.SOURCEINDIA_CONTACT_QA_ADMIN_EMAIL||'').toLowerCase(),from=(e.SOURCEINDIA_CONTACT_QA_MAIL_FROM||'').toLowerCase();
const allow=new Set((e.SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
if(e.SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED!=='1')problems.push('QA contact SMTP explicitly disabled');
if(!admin||!from||!allow.has(admin))problems.push('QA admin/from email and admin allowlist incomplete');
for(const key of ['SOURCEINDIA_CONTACT_QA_SMTP_HOST','SOURCEINDIA_CONTACT_QA_SMTP_USER','SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD'])if(!e[key])problems.push(`${key} missing`);
if(!e.DB_USER||e.DB_PASSWORD===undefined)problems.push('Local DB credentials incomplete');
if(problems.length){console.log('BULK129 ISOLATED QA READINESS: NOT READY');for(const issue of problems)console.log(' -',issue);console.log('No connection, SQL writes or mail attempted.');process.exitCode=2;}
else{
 let mysql;try{mysql=require('mysql2/promise');}catch{console.error('mysql2 missing; run npm ci');process.exit(2);}
 let conn;
 try{
  conn=await mysql.createConnection({host:e.DB_HOST,port:Number(e.DB_PORT||3306),user:e.DB_USER,password:e.DB_PASSWORD,database:name,connectTimeout:7000});
  const required={contacts:['contact_id','uuid','fname','lname','email','subject','message','is_delete','created_at','updated_at'],front_menu:['front_menu_id','uuid','parent_id','name','link','is_show','status','type','position','created_at','updated_at'],emails:['email_id','subject','message']};
  let missing=false;
  for(const [table,cols] of Object.entries(required)){
   const [rows]=await conn.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[name,table]);
   const actual=new Set(rows.map(r=>r.COLUMN_NAME));const absent=cols.filter(c=>!actual.has(c));
   console.log(`${absent.length?'FAIL':'PASS'} ${table}: ${absent.length?absent.join(', '):cols.length+' columns'}`);
   missing ||= Boolean(absent.length);
  }
  console.log(`BULK129 ISOLATED QA READINESS: ${missing?'NOT READY':'READY FOR CONTROLLED QA TESTING (NOT PARITY VERIFIED)'}`);
  if(missing)process.exitCode=2;
  console.log('Read-only INFORMATION_SCHEMA preflight. NO writes or SMTP sent.');
 }catch(error){console.log('BULK129 QA DB CONNECTION: FAILED',error.code||'unknown');process.exitCode=2;}
 finally{if(conn)await conn.end();}
}
