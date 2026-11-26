/** Read-only schema metadata preflight; does not access users' actual records. */
import {existsSync} from 'node:fs';
import {BULK109_TABLES} from './bulk109-schema.mjs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Cannot read .env.local');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('DB variables missing.');process.exit(1);}
const port=Number(DB_PORT||3306);if(!Number.isSafeInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;try{mysql=(await import('mysql2/promise')).default;}catch{console.error('mysql2 missing: run npm ci');process.exit(1);}
let db,pass=0,fail=0;
try{
 db=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await db.execute('SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=?',[DB_NAME]);
 const columns=new Map();for(const row of rows){if(!columns.has(row.TABLE_NAME))columns.set(row.TABLE_NAME,new Set());columns.get(row.TABLE_NAME).add(row.COLUMN_NAME);}
 for(const [table,fields] of Object.entries(BULK109_TABLES)){
  const exists=columns.has(table);
  const missing=exists?fields.filter(f=>!columns.get(table).has(f)):['<table missing>'];
  if(missing.length){fail++;console.log(`FAIL ${table}: missing ${missing.join(', ')}`);}
  else {pass++;console.log(`PASS ${table}: ${fields.length} expected columns`);}
 }
}catch(e){fail++;console.log('FAIL DB schema metadata: '+(typeof e?.code==='string'?e.code:'connection error'));}
finally{if(db)await db.end().catch(()=>{});}
console.log(`BULK109 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only INFORMATION_SCHEMA; no user records retrieved or modified.');
if(fail)process.exitCode=1;
