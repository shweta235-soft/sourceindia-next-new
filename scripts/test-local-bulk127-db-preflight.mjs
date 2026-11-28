/** INFORMATION_SCHEMA-only validation; absolutely no database mutations. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(process.env.DB_HOST===undefined){try{process.loadEnvFile('.env.local');}catch{}}
let mysql;try{mysql=require('mysql2/promise');}catch{console.error('mysql2 unavailable. Run npm ci.');process.exit(1);}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Local DB env missing.');process.exit(1);}
let conn;try{conn=await mysql.createConnection({host:DB_HOST,port:Number(process.env.DB_PORT||3306),user:DB_USER,password:DB_PASSWORD,database:DB_NAME,connectTimeout:7000});
const tables={contacts:['contact_id','uuid','fname','lname','email','subject','message','is_delete','created_at','updated_at'],emails:['email_id','subject','message']};let pass=0,fail=0;
for(const [table,cols] of Object.entries(tables)){const [rows]=await conn.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[DB_NAME,table]);const actual=new Set(rows.map(x=>x.COLUMN_NAME));const missing=cols.filter(x=>!actual.has(x));if(missing.length){fail++;console.log('FAIL',table,'missing:',missing.join(','));}else{pass++;console.log('PASS',table,cols.length,'required columns');}}
console.log(`BULK127 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);console.log('Read-only INFORMATION_SCHEMA. No data or schema changed.');if(fail)process.exitCode=1;
}catch(e){console.error('DB preflight failed:',e.code||e.message);process.exitCode=1;}finally{if(conn)await conn.end();}
