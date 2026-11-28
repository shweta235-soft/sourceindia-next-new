import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const root='src/app/v2/api/membership_plan/';
const cases=[
 ['route.ts',['GET','POST']],['count/route.ts',['GET']],['server-side/route.ts',['GET']],
 ['delete-selected/route.ts',['DELETE']],['[id]/route.ts',['GET','PUT','DELETE']],
 ['[id]/status/route.ts',['PATCH']],['[id]/delete_status/route.ts',['PATCH']]
];
test('BULK141 all 10 Express method/path registrations have native handlers',()=>{
 let count=0;
 for(const [path,methods] of cases){const file=root+path;assert.ok(existsSync(file),file);const source=read(file);
  assert.match(source,/localBulk141MembershipPlans/);for(const m of methods){assert.match(source,new RegExp(`export (?:async )?function ${m}\\(`),`${path} ${m}`);count++;}}
 assert.equal(count,10);
 const legacy=read('legacy/sourceindia-express/routes/membershipPlanRoutes.js');
 assert.equal((legacy.match(/router\.(?:get|post|put|patch|delete)\(/g)||[]).length,10);
});
test('BULK141 guarded create/update/delete, status, soft delete and bulk delete are implemented',()=>{
 const code=read('src/lib/localBulk141MembershipPlans.ts');
 for(const fn of ['createMembershipPlan','updateMembershipPlan','deleteMembershipPlan','deleteSelectedMembershipPlans','membershipPlanToggle']){
  assert.match(code,new RegExp(`export async function ${fn}\\(`));}
 assert.match(code,/membershipQaGate\(req\)/);
 assert.match(code,/beginTransaction\(/);
 assert.match(code,/commit\(/);
 assert.match(code,/rollback\(/);
});
test('BULK141 no authorized writes against live/default database',()=>{
 const code=read('src/lib/localBulk141MembershipPlans.ts');
 assert.match(code,/NODE_ENV==='production'/);
 assert.match(code,/SOURCEINDIA_MEMBERSHIP_QA_WRITES_ENABLED/);
 assert.match(code,/SOURCEINDIA_MEMBERSHIP_QA_DB_NAME/);
 assert.match(code,/SOURCEINDIA_MEMBERSHIP_QA_TOKEN/);
 assert.match(code,/timingSafeEqual/);
 assert.match(code,/\(qa\|test\|sandbox\)/);
});
test('BULK141 GET response fields grounded in Express model and controller',()=>{
 const code=read('src/lib/localBulk141MembershipPlans.ts');
 const model=read('legacy/sourceindia-express/models/MembershipPlan.js');
 assert.match(model,/membership_plan_id/);
 for(const prop of ['uuid','name','sub_title','price','user','category','product','expire_days','enquiries','is_default','elcina_plan','status','is_delete'])assert.ok(code.includes(prop),prop);
 for(const key of ['totalRecords','filteredRecords','getStatus'])assert.ok(code.includes(key));
});
