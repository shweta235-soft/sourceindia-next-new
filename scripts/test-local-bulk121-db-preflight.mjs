/** BULK121 INFORMATION_SCHEMA only: safe on production or development DB. */
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Could not load .env.local');process.exit(1);}
const require=createRequire(import.meta.url);
let mysql;try{mysql=require('mysql2/promise');}catch{console.error('mysql2 unavailable; run npm ci');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Local DB credentials missing.');process.exit(1);}
const expected={
 admins:['admin_id','status','role'],roles:['role_id','ticket_category','status','is_delete'],
 tickets:['tickets_id','ticket_id','token','category','created_at','updated_at','email','status'],
 ticket_replies:['ticket_reply_id','ticket_id','created_at','reply'],
 ticket_categories:['ticket_category_id','name'],users:['user_id','fname'],
};
let db,pass=0,fail=0;
try{
 db=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port:Number(process.env.DB_PORT||3306),connectTimeout:8000});
 for(const [table,cols] of Object.entries(expected)){
  const [rows]=await db.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[DB_NAME,table]);
  const got=new Set(rows.map(x=>x.COLUMN_NAME));const missing=cols.filter(c=>!got.has(c));
  if(missing.length){console.log(`FAIL ${table}: ${missing.join(', ')}`);fail++;}else{console.log(`PASS ${table}: ${cols.length} required columns`);pass++;}
 }
}catch(e){console.error('FAIL DB PREFLIGHT',e?.code||e?.message||'unknown');fail++;}
finally{await db?.end().catch(()=>{});}
console.log(`BULK121 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only INFORMATION_SCHEMA only. No data or schema changed.');
if(fail)process.exitCode=1;
