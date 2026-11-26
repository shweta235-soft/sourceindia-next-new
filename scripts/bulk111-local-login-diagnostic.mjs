/** Local-only, read-only diagnosis of why separate local JWT login rejects credentials.
 * Never requests the live API and never logs identifiers, credentials, SQL or hashes.
 */
export function classifyLocalBuyer(row, passwordMatches, hashCompatible){
 if(!row)return 'LOCAL_ACCOUNT_NOT_FOUND';
 if(Number(row.is_delete)!==0||Number(row.status)!==1)return 'LOCAL_ACCOUNT_INACTIVE';
 if(Number(row.is_seller)!==0)return 'LOCAL_ACCOUNT_NOT_BUYER';
 if(!hashCompatible)return 'LOCAL_PASSWORD_HASH_UNSUPPORTED';
 if(!passwordMatches)return 'LOCAL_PASSWORD_MISMATCH';
 return 'LOCAL_ACCOUNT_CREDENTIALS_MATCH_CHECK_SERVER';
}
export async function diagnoseLocalBuyerCredentials(email,password){
 let conn;
 try{
  const {existsSync}=await import('node:fs');
  if(existsSync('.env.local'))process.loadEnvFile('.env.local');
  const {DB_HOST,DB_USER,DB_PASSWORD,DB_NAME,DB_PORT}=process.env;
  if(!DB_HOST||!DB_USER||DB_PASSWORD===undefined||!DB_NAME)return 'LOCAL_DB_CONFIG_UNAVAILABLE';
  const mysql=(await import('mysql2/promise')).default;
  conn=await mysql.createConnection({host:DB_HOST,user:DB_USER,password:DB_PASSWORD,database:DB_NAME,port:Number(DB_PORT||3306),connectTimeout:8000,multipleStatements:false});
  const [rows]=await conn.execute('SELECT is_seller,status,is_delete,password FROM users WHERE email=? LIMIT 1',[email.trim().toLowerCase()]);
  const row=rows[0];
  if(!row)return classifyLocalBuyer(null,false,false);
  if(Number(row.status)!==1||Number(row.is_delete)!==0||Number(row.is_seller)!==0)return classifyLocalBuyer(row,false,false);
  const hash=typeof row.password==='string'?row.password.replace(/^\$2y\$/,'$2a$'):'';
  const compatible=/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
  const matches=compatible?await (await import('bcryptjs')).compare(password,hash):false;
  return classifyLocalBuyer(row,matches,compatible);
 }catch(e){return typeof e?.code==='string'&&/^[A-Z0-9_]{3,40}$/.test(e.code)?'LOCAL_DB_'+e.code:'LOCAL_DB_DIAGNOSTIC_UNAVAILABLE';}
 finally{if(conn)await conn.end().catch(()=>{});}
}
