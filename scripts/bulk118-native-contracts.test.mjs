/** Source contract regression tests; no database, writes, emails or uploads. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const native=readFileSync(join(root,'src/lib/localBulk118PublicReads.ts'),'utf8');
const legacy=join(root,'legacy/sourceindia-express');
const cases=[
 ['activities/route.ts','getActivities','activities','getAllActivities'],
 ['activities/server-side/route.ts','getGrid','activities','getAllActivitiesServerSide'],
 ['activities/count/route.ts','getActivityCount','activities','getActivityCount'],
 ['activities/coreactivity/[coreactivity]/route.ts','getActivitiesByCore','activities','getActivityByCoreActivity'],
 ['activities/[id]/route.ts','getActivityById','activities','getActivityById'],
 ['core_activities/route.ts','getCoreActivities','core_activities','getAllCoreActivities'],
 ['core_activities/server-side/route.ts','getGrid','core_activities','getAllCoreActivitiesServerSide'],
 ['core_activities/count/route.ts','getCoreActivityCount','core_activities','getCoreActivityCount'],
 ['core_activities/colors/route.ts','getCoreColors','core_activities','getAllColors'],
 ['core_activities/[id]/route.ts','getCoreActivityById','core_activities','getCoreActivityById'],
 ['faq_categories/route.ts','getFaqCategories','faq_categories','getAllFaqCategories'],
 ['faq_categories/server-side/route.ts','getGrid','faq_categories','getAllFaqCategoriesServerSide'],
 ['faq_categories/[id]/route.ts','getFaqCategoryById','faq_categories','getFaqCategoryById'],
 ['faqcategories/route.ts','getFaqCategories','faqcategories','getAllFaqCategories'],
 ['faqcategories/server-side/route.ts','getGrid','faqcategories','getAllFaqCategoriesServerSide'],
 ['faqcategories/[id]/route.ts','getFaqCategoryById','faqcategories','getFaqCategoryById'],
];
test('16 original Express method/path registrations now have explicit native GET route files',()=>{
 const original=readFileSync(join(root,'migration/phase57-express-endpoints.csv'),'utf8');
 const base=join(root,'src/app/v2/api');
 for(const [file,handler,prefix] of cases){
  const path=join(base,file);assert.ok(existsSync(path),file);
  const source=readFileSync(path,'utf8');assert.match(source,/export (?:async )?(?:const|function) GET\b/);assert.ok(source.includes(handler));
  assert.doesNotMatch(source,/export (?:async )?(?:const|function) (POST|PUT|PATCH|DELETE)\b/);
  const legacyPath='/v2/api/'+file.replace(/\/route\.ts$/,'').replace(/\/\[(\w+)\]/g,'/:$1').replace(/\/\[coreactivity\]/g,'/:coreactivity');
  assert.ok(original.includes('GET,'+legacyPath+',') || original.includes('GET,'+legacyPath+'/,'), 'Original Express method/path absent: '+legacyPath);
 }
});
test('original controller methods found (independent sources, not bridge passthrough)',()=>{
 const map={activities:'activityController.js',core_activities:'coreActivityController.js',faq_categories:'faqCategoryController.js',faqcategories:'faqCategoryController.js'};
 for(const [, , prefix, method] of cases){
  const source=readFileSync(join(legacy,'controllers',map[prefix]),'utf8');
  assert.ok(source.includes('exports.'+method+' = '),`${prefix} ${method}`);
 }
 assert.doesNotMatch(native,/legacyExpressBridgeRequest|from.*legacy\/sourceindia-express/);
});
test('native SQL uses parameter binding and explicit columns, never SELECT star',()=>{
 assert.doesNotMatch(native,/SELECT\s+\*/i);
 assert.doesNotMatch(native,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP)\s+(?:INTO|FROM|TABLE|\w+)/i);
 assert.match(native,/localAccountDatabase\(\)/);
 assert.match(native,/db\.execute<RowDataPacket\[\]>/);
 assert.match(native,/a\.activity_id AS id/);
 assert.match(native,/ca\.core_activity_id AS id/);
 assert.match(native,/f\.faqcategory_id AS id/);
});
test('schema preflight enumerates exactly the referenced tables and key columns',async()=>{
 const {BULK118_TABLES}=await import('./bulk118-schema.mjs');
 assert.deepEqual(Object.keys(BULK118_TABLES).sort(),['activities','colors','company_info','core_activities','faqcategories','upload_images'].sort());
 assert.ok(BULK118_TABLES.activities.includes('activity_id'));
 assert.ok(BULK118_TABLES.core_activities.includes('core_activity_id'));
});
test('previous bridge, product and frontend code preserved',()=>{
 for(const path of ['src/app/v2/api/[...legacy]/route.ts','src/lib/localBulk116Products.ts','src/lib/localLegacyExpressBridge.ts','scripts/test-local-bulk117.ps1']){
  assert.ok(existsSync(join(root,path)),path);
 }
});
