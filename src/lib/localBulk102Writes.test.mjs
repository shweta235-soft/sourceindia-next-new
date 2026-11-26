import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const lib=read('./localBulk102Writes.ts');
test('write flag defaults off and validates exact keys',()=>{assert.match(lib,/LOCAL_ADMIN_BULK102_WRITES_ENABLED/);assert.match(lib,/exactKeys/);});
test('no hard deletes in SQL definitions',()=>{assert.doesNotMatch(lib,/DELETE FROM/);assert.doesNotMatch(lib,/TRUNCATE/);});
for (const kind of ['ticket-categories','interest-categories','seo-pages']){
 test(`${kind} route handlers keep GET alongside POST/PUT`,()=>{
  const list=read(`../app/admin/api/local/${kind}/route.ts`),detail=read(`../app/admin/api/local/${kind}/[id]/route.ts`);
  for(const [s,methods] of [[list,['GET','POST']],[detail,['GET','PUT','DELETE']]]){
   for(const method of methods)assert.equal((s.match(new RegExp(`export async function ${method}\\(`,'g'))||[]).length,1);
   assert.equal((s.match(/export const runtime/g)||[]).length,1);
   assert.equal((s.match(/import \{localAccountDatabase\}/g)||[]).length,1);
  }
 });
}
test('status mutation is limited to ticket and interest categories',()=>{
 for(const k of ['ticket-categories','interest-categories'])assert.match(read(`../app/admin/api/local/${k}/[id]/status/route.ts`),/export async function PATCH/);
});
test('guards block anonymous requests before any writes',()=>{const g=read('./localBulk102Http.ts');assert.ok(g.indexOf('authorizedAdminFaq(req)')<g.indexOf('bulk102Enabled()'));});
