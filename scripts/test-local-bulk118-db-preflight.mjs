/** BULK118: INFORMATION_SCHEMA only; no data or schema mutation. */
import {existsSync} from 'node:fs';
import {BULK118_TABLES} from './bulk118-schema.mjs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot load .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Missing DB connection variables');process.exit(1);}
const port=Number(DB_PORT||3306);
if(!Number.isSafeInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;try{mysql=(await import('mysql2/promise')).default;}catch{console.error('mysql2 missing: run npm ci');process.exit(1);}
let connection,pass=0,fail=0;
try{
 connection=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await connection.execute('SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=?',[DB_NAME]);
 const map=new Map();for(const r of rows){if(!map.has(r.TABLE_NAME))map.set(r.TABLE_NAME,new Set());map.get(r.TABLE_NAME).add(r.COLUMN_NAME);}
 for(const [table,required] of Object.entries(BULK118_TABLES)){
  const missing=map.has(table)?required.filter(col=>!map.get(table).has(col)):['table missing'];
  if(missing.length){fail++;console.log(`FAIL ${table}: ${missing.join(', ')}`);}else{pass++;console.log(`PASS ${table}: ${required.length} required columns`);}
 }
}catch(e){fail++;console.log('FAIL database preflight: '+(e?.code||'UNKNOWN'));}
finally{if(connection)await connection.end().catch(()=>{});}
console.log(`BULK118 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Only INFORMATION_SCHEMA queried; no application data or schema changed.');
if(fail)process.exitCode=1;
