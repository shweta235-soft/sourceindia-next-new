/** Bulk106 DB preflight: INFORMATION_SCHEMA columns only. No user data read or writes. */
import {existsSync} from 'node:fs';
import {requiredSchema} from './bulk106-contracts.mjs';
if(existsSync('.env.local')){try{process.loadEnvFile('.env.local');}catch{console.error('Unable to read .env.local');process.exit(1);}}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Bulk106 DB variables missing in .env.local');process.exit(1);}
const port=DB_PORT?Number(DB_PORT):3306;
if(!Number.isSafeInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;
try {mysql=(await import('mysql2/promise')).default;}
catch {console.error('Missing mysql2; run npm ci');process.exit(1);}
let connection;let pass=0,fail=0;
try{
 connection=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,
  port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await connection.execute('SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?',[DB_NAME]);
 const existing=new Map();
 for(const row of rows){if(!existing.has(row.TABLE_NAME))existing.set(row.TABLE_NAME,new Set());existing.get(row.TABLE_NAME).add(row.COLUMN_NAME);}
 for(const [table,columns] of Object.entries(requiredSchema())){
  const found=existing.get(table);
  const missing=found?columns.filter(c=>!found.has(c)):['<table missing>'];
  if(missing.length){fail++;console.log(`FAIL ${table}: ${missing.join(', ')}`);}
  else{pass++;console.log(`PASS ${table}: ${columns.length} expected columns present`);}
 }
}catch(err){fail++;console.error('DB schema connection failed; check DB configuration.');if(typeof err?.code==='string')console.error('DB error code: '+err.code);}
finally{if(connection)await connection.end().catch(()=>{});}
console.log(`BULK106 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only metadata inspection: no writes and no user records accessed.');
if(fail)process.exitCode=1;
