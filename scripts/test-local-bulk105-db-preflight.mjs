/** Safe DB schema read preflight.
 * Uses SELECT from information_schema only; no DDL, writes, data rows or passwords printed.
 * Does not use live React API. Intended for localhost project with a configured .env.local.
 */
import {existsSync} from 'node:fs';
import {BULK105_TABLES, schemaDiff} from './bulk105-schema.mjs';
if(existsSync('.env.local')){
 try{process.loadEnvFile('.env.local');}
 catch {console.error('Unable to read .env.local.');process.exit(1);}
}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){
 console.error('BULK105 DB SCHEMA RESULTS: NOT RUN (DB_HOST, DB_USER, DB_PASSWORD or DB_NAME missing)');process.exit(1);
}
const port=DB_PORT?Number(DB_PORT):3306;
if(!Number.isSafeInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;
try {mysql=(await import('mysql2/promise')).default;}
catch{console.error('mysql2 dependency missing. Run npm ci.');process.exit(1);}
let connection;
let pass=0,fail=0;
try{
 connection=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,
  port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await connection.execute(`SELECT TABLE_NAME, COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?`,[DB_NAME]);
 const existing=new Map();
 for(const row of rows){
  if(!existing.has(row.TABLE_NAME))existing.set(row.TABLE_NAME,new Set());
  existing.get(row.TABLE_NAME).add(row.COLUMN_NAME);
 }
 for(const [table,required] of Object.entries(BULK105_TABLES)){
  const found=existing.get(table);
  if(!found){console.log(`FAIL ${table}: table not found`);fail++;continue;}
  const missing=schemaDiff(required,found);
  if(missing.length){console.log(`FAIL ${table}: missing columns ${missing.join(', ')}`);fail++;}
  else {console.log(`PASS ${table}: ${required.length} required columns present`);pass++;}
 }
} catch(error){
 console.error('DB preflight could not connect/read metadata. Check the local DB service, DB settings and SELECT permissions.');
 // Error names/codes only, never credentials, SQL rows or raw URLs.
 if(typeof error?.code==='string')console.error(`Database error code: ${error.code}`);
 fail++;
} finally {if(connection)await connection.end().catch(()=>{});}
console.log('------------------------------------');
console.log(`BULK105 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only information_schema inspection; no user/customer table records accessed.');
if(fail)process.exitCode=1;
