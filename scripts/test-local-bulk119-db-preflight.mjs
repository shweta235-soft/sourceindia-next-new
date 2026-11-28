/** DB metadata only — never query tables' data or perform writes. */
import {createRequire} from 'node:module';
import {BULK119_TABLES} from './bulk119-schema.mjs';
import {existsSync} from 'node:fs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Unable to load .env.local');process.exit(1);}
const require=createRequire(import.meta.url);
let mysql;try{mysql=require('mysql2/promise');}catch{console.error('mysql2 missing: run npm ci');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Database credentials missing');process.exit(1);}
let db,pass=0,fail=0;
try{
 db=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port:Number(process.env.DB_PORT||3306),connectTimeout:8000});
 for(const [table,columns] of Object.entries(BULK119_TABLES)){
  const [rows]=await db.execute('SELECT COLUMN_NAME,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[DB_NAME,table]);
  const known=new Set(rows.map(row=>row.COLUMN_NAME));const missing=columns.filter(col=>!known.has(col));
  if(missing.length){fail++;console.log(`FAIL ${table}: missing ${missing.join(',')}`);}else{pass++;const dates=rows.filter(row=>['created_at','updated_at'].includes(row.COLUMN_NAME)).map(row=>`${row.COLUMN_NAME}:${row.DATA_TYPE}`);console.log(`PASS ${table}: ${columns.length} required columns${dates.length?' date-types='+dates.join(','):''}`);}
 }
}catch(e){fail++;console.error('FAIL DB PREFLIGHT',e?.code||e?.message||'UNKNOWN');}
finally{await db?.end().catch(()=>{});}
console.log(`BULK119 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('INFORMATION_SCHEMA only; no data or schema modified.');if(fail)process.exitCode=1;
