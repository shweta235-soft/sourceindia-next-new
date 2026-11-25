// Bulk91 authenticated smoke test with explicit cookie transfer. No database writes.
// Credentials are supplied on standard input, never as CLI arguments or in output.
import { readFileSync } from 'node:fs';

const base = process.env.LOCAL_TEST_BASE_URL || 'http://localhost:3000';
const origin = new URL(base).origin;
let input;
try { input = JSON.parse(Buffer.from(readFileSync(0, 'utf8').trim(), 'base64').toString('utf8')); }
catch { console.error('Invalid credential input from PowerShell. Confirm the updated Bulk91 wrapper is installed.'); process.exit(1); }
const email = typeof input.email === 'string' ? input.email.trim() : '';
const password = typeof input.password === 'string' ? input.password : '';
input = null;
if (!email || !password) { console.error('Admin email and password are required.'); process.exit(1); }
let pass = 0, fail = 0;
async function request(path, {method='GET', body, cookie}={}) {
  try {
    const res = await fetch(origin+path, {
      method, redirect:'manual', cache:'no-store',
      headers: {'Accept':'application/json', ...(cookie ? {'Cookie':cookie} : {}), ...(method !== 'GET' ? {'Origin':origin, 'Content-Type':'application/json'} : {})},
      ...(body ? {body:JSON.stringify(body)} : {}),
      signal: AbortSignal.timeout(12000),
    });
    const json = (res.headers.get('content-type') || '').toLowerCase().includes('application/json');
    const payload = json ? await res.json().catch(()=>null) : null;
    return { status:res.status, json, payload, setCookie:res.headers.get('set-cookie') || '' };
  } catch { return { status:0, json:false, payload:null, setCookie:'' }; }
}
function check(name, r, expected, expectedAuth) {
  const ok = r.status===expected && r.json && (expectedAuth===undefined || r.payload?.authenticated === expectedAuth);
  console.log(`${name}: HTTP ${r.status}${r.json?' JSON':''} ${ok?'PASS':`FAIL (expected ${expected}${expectedAuth===undefined?'':` auth=${expectedAuth}`})`}`);
  ok ? pass++ : fail++;
}
const login = await request('/api/admin-session', {method:'POST', body:{email,password}});
if (login.status !== 200 || !login.json) {
  console.log(`Admin login: HTTP ${login.status} FAIL. Verify Admin login credentials.`);
  console.log('BULK91 AUTHENTICATED RESULTS: NOT RUN (login failed)');
  process.exitCode=1;
} else {
  const match=login.setCookie.match(/(?:^|[,;]\s*)si_admin_session=([^;,\s]+)/);
  if (!match) {
    console.log('Admin login: HTTP 200 but signed Admin cookie missing.');
    console.log('BULK91 AUTHENTICATED RESULTS: NOT RUN (cookie missing)');
    process.exitCode=1;
  } else {
    const cookie=`si_admin_session=${match[1]}`;
    check('Admin login + cookie', login, 200);
    const status=await request('/admin/session-status',{cookie});
    check('Admin session status',status,200,true);
    if (status.payload?.authenticated !== true) {
      console.log('DIAGNOSTIC: Admin cookie reaches Node HTTP client, but /admin/session-status does not validate it. Check ADMIN_SESSION_SECRET consistency and Next.js server restart.');
    } else {
      check('Admin FAQ list',await request('/admin/api/local/faqs',{cookie}),200);
      check('Admin FAQ categories',await request('/admin/api/local/faqs/categories',{cookie}),200);
      check('Invalid FAQ detail ID',await request('/admin/api/local/faqs/invalid',{cookie}),400);
      check('Invalid category detail ID',await request('/admin/api/local/faqs/categories/invalid',{cookie}),400);
    }
    // Logout has no database effect; explicitly drop test cookie afterward.
    check('Test-session logout',await request('/api/admin-session',{method:'DELETE'}),200);
    check('FAQ access after logout',await request('/admin/api/local/faqs'),401);
    console.log('------------------------------------');
    console.log(`BULK91 AUTHENTICATED RESULTS: PASS=${pass} FAIL=${fail} TOTAL=${pass+fail}`);
    console.log('No FAQ data printed or modified. Credentials and cookie not printed.');
    if(fail)process.exitCode=1;
  }
}
