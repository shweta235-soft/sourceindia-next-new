import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync('src/lib/localBulk142Emails.ts','utf8');
const paths=[['route.ts',['GET','POST']],['count/route.ts',['GET']],['server-side/route.ts',['GET']],['clone/route.ts',['POST']],['[id]/route.ts',['GET','PUT','DELETE']]];
test('BULK142: 8 original method+path exports',()=>{
 const routes=readFileSync('legacy/sourceindia-express/routes/emailsRoutes.js','utf8');
 assert.equal((routes.match(/router\.(?:get|post|put|patch|delete)\(/g)||[]).length,8);
 let count=0;for(const [name,methods] of paths){const file='src/app/v2/api/emails/'+name;assert.ok(existsSync(file),file);const code=readFileSync(file,'utf8');for(const method of methods){assert.match(code,new RegExp('export (?:async )?function '+method+'\\('));count++;}}assert.equal(count,8);
});
test('BULK142: all 8 native endpoint methods implemented',()=>{
 for(const fn of ['listEmails','emailsCount','getEmail','emailsServerSide','createEmail','updateEmail','deleteEmail','cloneEmail'])assert.match(source,new RegExp('export async function '+fn+'\\('));
});
test('BULK142: safe gated writes and transactions',()=>{
 for(const part of ['NODE_ENV===\'production\'','SOURCEINDIA_EMAILS_QA_WRITES_ENABLED','SOURCEINDIA_EMAILS_QA_DB_NAME','SOURCEINDIA_EMAILS_QA_TOKEN','timingSafeEqual','beginTransaction','rollback','commit'])assert.ok(source.includes(part),part);
 for(const fn of ['createEmail','updateEmail','deleteEmail','cloneEmail'])assert.match(source.slice(source.indexOf('export async function '+fn)),/emailsQaGate\(req\)/);
});
test('BULK142: Express BLOB response modes preserved',()=>{
 const original=readFileSync('legacy/sourceindia-express/controllers/emailsController.js','utf8');assert.match(original,/message\?\.toString\('utf8'\)/);
 for(const part of ['asSequelizeJson','asDetail','asServer','toJSON()','toString(\'utf8\')','getStatus','totalRecords','filteredRecords'])assert.ok(source.includes(part),part);
});
