/** Read-only INFORMATION_SCHEMA check for Bulk114 tables. No row reads or writes. */
import {existsSync} from 'node:fs';
import {BULK114_TABLES} from './bulk114-schema.mjs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot read .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Missing DB configuration');process.exit(1);}
const port=Number(DB_PORT||3306);if(!Number.isSafeInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;try{mysql=(await import('mysql2/promise')).default;}catch{console.error('mysql2 unavailable; run npm ci');process.exit(1);}
let conn,pass=0,fail=0;
try{
 conn=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await conn.execute('SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=?',[DB_NAME]);
 const columns=new Map();for(const r of rows){if(!columns.has(r.TABLE_NAME))columns.set(r.TABLE_NAME,new Set());columns.get(r.TABLE_NAME).add(r.COLUMN_NAME);}
 for(const [table,required] of Object.entries(BULK114_TABLES)){
  const missing=columns.has(table)?required.filter(c=>!columns.get(table).has(c)):['<table missing>'];
  if(missing.length){fail++;console.log(`FAIL ${table}: missing ${missing.join(', ')}`);}else{pass++;console.log(`PASS ${table}: ${required.length} expected columns`);}
 }
}catch(e){fail++;console.log('FAIL schema connection: '+(typeof e?.code==='string'?e.code:'UNKNOWN'));}
finally{if(conn)await conn.end().catch(()=>{});}
console.log(`BULK114 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('INFORMATION_SCHEMA only; no database records changed.');
if(fail)process.exitCode=1;
