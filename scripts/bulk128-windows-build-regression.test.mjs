import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('Front Menu read wrappers call zero-argument functions with no NextRequest (TS2554)',()=>{
 for(const [p,fn] of [
  ['src/app/v2/api/front_menu/count/route.ts','getMenuCount'],
  ['src/app/v2/api/front_menu/route.ts','getMenus']
 ]){
  const src=read(p);
  assert.match(src,new RegExp('return '+fn+'\\(\\)'));
  assert.ok(!src.includes(fn+'(req)'),p);
 }
});
test('Applications filesystem QA root opts out of large Turbopack tracing',()=>{
 const src=read('src/lib/localBulk126ApplicationFiles.ts');
 assert.match(src,/resolve\(\/\* turbopackIgnore: true \*\/ supplied\)/);
 assert.match(src,/APPLICATION_QA_STORAGE_REQUIRED/);
});
test('Contacts native writes retain QA auth, SMTP allowlist and original template IDs',()=>{
 const src=read('src/lib/localBulk127Contacts.ts');
 for(const word of ['SOURCEINDIA_CONTACT_WRITES_ENABLED','SOURCEINDIA_CONTACT_QA_DB_NAME','SOURCEINDIA_CONTACT_QA_TOKEN','SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST','mailTemplateIds={admin:61,user:59}'])assert.ok(src.includes(word));
});
