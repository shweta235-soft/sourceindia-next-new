/** Only metadata is queried. No user data, CRUD, email or uploads. */
import {existsSync} from 'node:fs';
import {BULK108_TABLES} from './bulk108-schema.mjs';
import {resolveNewsletterHistoryIdentity} from '../src/lib/localBulk108HistoryIdentity.mjs';
if(existsSync('.env.local')){
 try{process.loadEnvFile('.env.local');}catch{console.error('Cannot read .env.local');process.exit(1);}
}
const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME){console.error('Missing local DB credentials in .env.local');process.exit(1);}
const port=DB_PORT?Number(DB_PORT):3306;
if(!Number.isInteger(port)||port<1||port>65535){console.error('Invalid DB_PORT');process.exit(1);}
let mysql;
try{mysql=(await import('mysql2/promise')).default;}
catch{console.error('mysql2 missing; run npm ci.');process.exit(1);}
let client,pass=0,fail=0;
try{
 client=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port,connectTimeout:8000,multipleStatements:false});
 const [rows]=await client.execute('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_KEY,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ?',[DB_NAME]);
 const found=new Map();for(const row of rows){if(!found.has(row.TABLE_NAME))found.set(row.TABLE_NAME,[]);found.get(row.TABLE_NAME).push(row);}
 for(const [table,columns] of Object.entries(BULK108_TABLES)){
  const actual=found.get(table);
  const names=actual?new Set(actual.map(x=>x.COLUMN_NAME)):null;
  const missing=names?columns.filter(x=>!names.has(x)):['<table missing>'];
  const historyKey=table==='news_latter_histories'&&actual?resolveNewsletterHistoryIdentity(actual):null;
  if(table==='news_latter_histories'&&actual&&!historyKey){
   missing.push('<no single integer primary/unique key or UNIQUE uuid; reporting requires a stable identity>');
  }
  if(missing.length){
   fail++;console.log(`FAIL ${table}: missing ${missing.join(', ')}`);
   if(table==='news_latter_histories'&&actual){
    console.log('INFO news_latter_histories column names: '+actual.map(x=>x.COLUMN_NAME).join(', '));
   }
  }else{
   pass++;console.log(`PASS ${table}: ${columns.length} expected columns${historyKey?`; detected identity=${historyKey}`:''}`);
  }
 }
}catch(e){fail++;console.log('FAIL DB metadata preflight: '+(typeof e?.code==='string'?e.code:'connection error'));}
finally{if(client)await client.end().catch(()=>{});}
console.log(`BULK108 DB SCHEMA RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
console.log('Read-only INFORMATION_SCHEMA check; database records unchanged.');
if(fail)process.exitCode=1;
