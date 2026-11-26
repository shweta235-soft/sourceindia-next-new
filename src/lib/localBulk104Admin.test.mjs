import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(join(root,p),'utf8');
const sources=read('src/lib/localBulk104Admin.ts');
const kinds=['roles','activities','core-activities','applications','membership-plans','interest-subcategories','shortcut-menus','contacts'];

test('eight explicitly audited management resources and model columns',()=>{
 for(const kind of kinds)assert.ok(sources.includes(`  '${kind}':`)||sources.includes(`  ${kind}:`),kind);
 for(const [table,id] of Object.entries({roles:'role_id',activities:'activity_id',core_activities:'core_activity_id',applications:'application_id',membership_plans:'membership_plan_id',interest_sub_categories:'interest_sub_category_id',shortcut_menus:'shortcut_id',contacts:'contact_id'})) {
  assert.ok(sources.includes(`table:'${table}'`)||sources.includes(`table: '${table}'`),table);
  assert.ok(sources.includes(`key:'${id}'`)||sources.includes(`key: '${id}'`),id);
 }
});
test('admin authentication, origin check, default-off and no hard-delete SQL',()=>{
 assert.match(sources,/authorizedAdminFaq\(req\)/);
 assert.match(sources,/adminFaqSameOrigin\(req\)/);
 assert.match(sources,/LOCAL_ADMIN_BULK104_WRITES_ENABLED === 'true'/);
 assert.doesNotMatch(sources,/\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b/i);
 assert.match(sources,/is_delete = 1/);
 assert.match(sources,/Hard deletion is deliberately disabled/);
});
test('SQL stays on explicit static identifiers and bound query parameters',()=>{
 assert.match(sources,/Object\.prototype\.hasOwnProperty\.call\(BULK104_RESOURCES,input\)/);
 assert.match(sources,/db\.execute/);
 assert.match(sources,/\? AND is_delete = 0/);
 assert.match(sources,/Number\.isSafeInteger/);
 assert.match(sources,/ids\.length>100/);
 assert.doesNotMatch(sources,/SELECT \*/);
});
test('routes expose expected operations with one handler per method',()=>{
 const map={
  'route.ts':['GET','POST'],
  'count/route.ts':['GET'],
  'server-side/route.ts':['GET'],
  '[id]/route.ts':['GET','PUT','DELETE'],
  '[id]/status/route.ts':['PATCH'],
  'delete-selected/route.ts':['DELETE'],
 };
 for(const kind of kinds){
  for(const [path,methods] of Object.entries(map)){
   if(kind==='contacts'&&(path==='[id]/status/route.ts'))continue;
   const file=`src/app/admin/api/local/${kind}/${path}`;
   assert.ok(existsSync(join(root,file)),file);
   const src=read(file);
   if(kind!=='interest-subcategories'&&kind!=='shortcut-menus'||!['route.ts','count/route.ts','[id]/route.ts'].includes(path)) assert.match(src,/bulk104Handle\(/);
   for(const method of methods){
    if(kind==='contacts'&&['POST','PUT'].includes(method))continue;
    assert.equal((src.match(new RegExp('export async function '+method+'\\(','g'))||[]).length,1,`${file} ${method}`);
   }
  }
 }
});
test('specialized reads retain signed admin gate and parameter binding',()=>{
 for(const file of ['src/app/admin/api/local/activities/coreactivity/[id]/route.ts','src/app/admin/api/local/core-activities/colors/route.ts']){
  const s=read(file);assert.match(s,/authorizedAdminFaq\(req\)/);assert.match(s,/db\.execute/);
 }
 assert.match(read('src/app/admin/api/local/activities/coreactivity/[id]/route.ts'),/coreactivity=\?/);
});
test('proxy returns JSON 401 for every local Admin route, not login HTML',()=>{
 const s=read('src/proxy.ts');assert.match(s,/pathname\.startsWith\("\/admin\/api\/local\/"\)/);
});
