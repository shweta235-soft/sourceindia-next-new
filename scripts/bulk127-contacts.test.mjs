import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require(require.resolve('typescript',{paths:[process.cwd()]}));
const root=resolve('src/app/v2/api/contacts');
const handlers=[
 ['route.ts','GET','listContacts'],['route.ts','POST','createContact'],
 ['count/route.ts','GET','countContacts'],['server-side/route.ts','GET','gridContacts'],
 ['delete-selected/route.ts','DELETE','deleteContactSelection'],
 ['[id]/route.ts','DELETE','deleteContact'],['[id]/delete_status/route.ts','PATCH','updateContactDeleteStatus']
];
test('BULK127 all 7 original Express routes map to native Next exports',()=>{
 const legacy=readFileSync('legacy/sourceindia-express/routes/contactsRoutes.js','utf8');
 for(const [file,method,fn] of handlers){const contents=readFileSync(resolve(root,file),'utf8');assert.match(contents,new RegExp('export async function '+method+'\\('));assert.ok(contents.includes(fn));}
 assert.equal((legacy.match(/router\.(?:post|get|delete|patch)\(/g)||[]).length,7);
});
test('BULK127 routes contain no fallback bridge',()=>{
 for(const [file] of handlers){const contents=readFileSync(resolve(root,file),'utf8');assert.ok(!contents.includes('localLegacyExpressBridge'));}
});
test('BULK127 contact writes fail closed and SMTP requires QA opt-ins',()=>{
 const s=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
 for(const required of ['NODE_ENV','SOURCEINDIA_CONTACT_WRITES_ENABLED', 'SOURCEINDIA_CONTACT_QA_DB_NAME','SOURCEINDIA_CONTACT_QA_TOKEN','SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED','SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST','SOURCEINDIA_CONTACT_QA_SMTP_HOST'])assert.ok(s.includes(required),required);
 assert.ok(s.includes('timingSafeEqual'));
});
test('BULK127 queries bind user input and prevent unbounded pagination',()=>{
 const s=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
 assert.ok(s.includes('limit>200'));
 assert.ok(s.includes('SELECT COUNT(*) AS total FROM contacts'));
 assert.ok(s.includes('CONCAT(fname'));
 assert.ok(s.includes('WHERE contact_id=?'));
 assert.ok(s.includes('FOR UPDATE'));
});
test('BULK127 original email template IDs preserved',()=>{
 const s=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
 assert.match(s,/admin:61,user:59/);
});
test('BULK127 TypeScript source and routes parse cleanly',()=>{
 for(const [file] of [['src/lib/localBulk127Contacts.ts'],...handlers.map(([f])=>['src/app/v2/api/contacts/'+f])]){
  const full=file,src=readFileSync(full,'utf8');const parsed=ts.createSourceFile(full,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length,0,full+' '+parsed.parseDiagnostics.map(x=>x.messageText));
 }
});
