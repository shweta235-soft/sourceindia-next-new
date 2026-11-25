/** Read-only local account login diagnostics. Input JSON from stdin, never CLI arguments. */
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import mysql from 'mysql2/promise';
import { compare } from 'bcryptjs';
loadEnvConfig(process.cwd());
const configured = ['DB_HOST', 'DB_USER', 'DB_NAME'].every(k => Boolean(process.env[k])) && process.env.DB_PASSWORD !== undefined;
if (!configured) { console.log('RESULT: DB_CONFIGURATION_MISSING'); process.exit(2); }
// The Windows PowerShell caller sends exactly two newline-separated UTF-8 fields.
// Do not log raw stdin, email or password; inputs are never CLI arguments.
let input = '';
for await (const chunk of process.stdin) {
  input += chunk.toString('utf8');
  if (Buffer.byteLength(input, 'utf8') > 4096) {
    console.log('RESULT: INPUT_TOO_LARGE'); process.exit(2);
  }
}
// Strip an optional leading UTF-8 BOM and accept CRLF from other shells.
input = input.replace(/^\uFEFF/, '');
const separator = input.indexOf('\n');
if (separator < 0) { console.log('RESULT: INPUT_FORMAT_INVALID'); process.exit(2); }
const req = {
  email: input.slice(0, separator).replace(/\r$/, ''),
  password: input.slice(separator + 1).replace(/\r?\n$/, ''),
};
if (!req.email.trim()) { console.log('RESULT: EMAIL_MISSING'); process.exit(2); }
if (!req.password) { console.log('RESULT: PASSWORD_MISSING'); process.exit(2); }
let db;
try {
  db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectTimeout:8000});
  const [rows]=await db.execute('SELECT user_id, status, is_delete, password FROM users WHERE email = ? LIMIT 1',[req.email.trim().toLowerCase()]);
  if (!rows.length) console.log('RESULT: ACCOUNT_NOT_FOUND_IN_LOCAL_DB');
  else {
    const u=rows[0];
    if (Number(u.status)!==1 || Number(u.is_delete)!==0) console.log('RESULT: ACCOUNT_INACTIVE_OR_DELETED');
    else {
      const h=typeof u.password==='string'?u.password:'';
      const hash=/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h) ? h.replace(/^\$2y\$/,'$2a$') : null;
      if(!hash) console.log('RESULT: LOCAL_PASSWORD_NOT_SUPPORTED_BCRYPT_HASH');
      else console.log((await compare(req.password,hash))?'RESULT: LOCAL_CREDENTIALS_MATCH':'RESULT: LOCAL_PASSWORD_DOES_NOT_MATCH');
    }
  }
} catch (err) { console.log('RESULT: DB_QUERY_FAILED'); console.log('ERROR_CODE: '+(typeof err?.code==='string'?err.code:'UNKNOWN')); process.exitCode=2; }
finally { if(db) await db.end(); req.password=''; input=''; }
