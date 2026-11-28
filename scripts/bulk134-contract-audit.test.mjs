import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const originalContact=readFileSync('legacy/sourceindia-express/controllers/contactsController.js','utf8');
const originalMenu=readFileSync('legacy/sourceindia-express/controllers/frontMenuController.js','utf8');
const nativeContact=readFileSync('src/lib/localBulk127Contacts.ts','utf8');
const nativeMenu=readFileSync('src/lib/localBulk128FrontMenu.ts','utf8');
test('Contacts original create does not lowercase submitted email before persistence',()=>{
 assert.match(originalContact,/Contacts\.create\(\{[\s\S]*?\bemail,/);
 assert.match(nativeContact,/const email=\(v:unknown\)=>[\s\S]*?\?s:null/);
 assert.doesNotMatch(nativeContact,/const email=\(v:unknown\)=>[^\n]*toLowerCase\(\)/);
});
test('Contacts QA allowlist is case-insensitive while stored email preserves submitted case',()=>{
 assert.match(nativeContact,/allow\.includes\(user\.toLowerCase\(\)\)/);
 assert.match(nativeContact,/email:userEmail/);
});
test('Front Menu original passes name unchanged into Sequelize and native input preserves it',()=>{
 assert.match(originalMenu,/FrontMenu\.create\(\{\s*parent_id, name,/);
 assert.match(nativeMenu,/return \{parent_id:parent,name,link,is_show:visible/);
 assert.doesNotMatch(nativeMenu,/name:name\.trim\(\)/);
});
test('Both modules retain production-deny isolated-QA mutation gates',()=>{
 assert.match(nativeContact,/NODE_ENV==='production'/);
 assert.match(nativeMenu,/NODE_ENV==='production'/);
 assert.match(nativeContact,/SOURCEINDIA_CONTACT_QA_DB_NAME/);
 assert.match(nativeMenu,/SOURCEINDIA_FRONT_MENU_QA_DB_NAME/);
});
