/** BULK124: INFORMATION_SCHEMA only, never reads user data or mutates DB. */
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
if(existsSync('.env.local'))try{process.loadEnvFile('.env.local');}catch{console.error('Unable to load .env.local');process.exit(1);}
const require=createRequire(import.meta.url);
let mysql;try{mysql=require('mysql2/promise');}catch{console.error('Install project dependencies first: npm ci');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Local DB config required.');process.exit(1);}
const needed=['ticket_category_id','uuid','name','email','status','created_at','updated_at'];
let db,fail=0;
try{db=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port:Number(process.env.DB_PORT||3306),connectTimeout:8000});
 const [rows]=await db.execute('SELECT COLUMN_NAME,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[DB_NAME,'ticket_categories']);
 const got=new Set(rows.map(row=>row.COLUMN_NAME));const missing=needed.filter(n=>!got.has(n));
 if(missing.length){console.log('FAIL ticket_categories missing:',missing.join(', '));fail++;}else console.log('PASS ticket_categories:',needed.length,'required columns');
}catch(e){console.error('FAIL DB SCHEMA',e?.code||e?.message||'unknown');fail++;}
finally{await db?.end().catch(()=>{});}
console.log(`BULK124 DB SCHEMA RESULTS: PASS=${fail?0:1} FAIL=${fail} TOTAL=1`);
console.log('Read-only INFORMATION_SCHEMA only. No records or schema changed.');if(fail)process.exitCode=1;
