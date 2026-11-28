import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {BULK119_TABLES} from './bulk119-schema.mjs';
const cwd=process.cwd();
const read=(file)=>readFileSync(join(cwd,file),'utf8');
const root='src/app/v2/api';
const cases=[
 ['faqs/route.ts','getList','faqRoutes.js','getAllFaqs'],
 ['faqs/count/route.ts','getCount','faqRoutes.js','getFaqCount'],
 ['faqs/server-side/route.ts','getGrid','faqRoutes.js','getAllFaqsServerSide'],
 ['faqs/[id]/route.ts','getDetail','faqRoutes.js','getFaqById'],
 ['seo_pages/route.ts','getList','seoPagesRoutes.js','getAllSeoPages'],
 ['seo_pages/count/route.ts','getCount','seoPagesRoutes.js','getSeoPagesCount'],
 ['seo_pages/server-side/route.ts','getGrid','seoPagesRoutes.js','getAllSeoPagesServerSide'],
 ['seo_pages/slug/[slug]/route.ts','getSeoBySlug','seoPagesRoutes.js','getSeoPagesBySlug'],
 ['seo_pages/[id]/route.ts','getDetail','seoPagesRoutes.js','getSeoPagesById'],
 ['testimonials/route.ts','getList','testimonialRoutes.js','getAllTestimonials'],
 ['testimonials/count/route.ts','getCount','testimonialRoutes.js','getTestimonialsCount'],
 ['testimonials/server-side/route.ts','getGrid','testimonialRoutes.js','getAllTestimonialsServerSide'],
 ['testimonials/[id]/route.ts','getDetail','testimonialRoutes.js','getTestimonialsById'],
 ['roles/route.ts','getList','rolesRoutes.js','getAllRoles'],
 ['roles/server-side/route.ts','getGrid','rolesRoutes.js','getAllRolesServerSide'],
 ['roles/[id]/route.ts','getDetail','rolesRoutes.js','getRolesById'],
 ['pages/[id]/route.ts','getDetail','pagesRoutes.js','getPagesById'],
];
test('all 17 native GET files and Express method/path source registrations exist',()=>{
 const inventory=read('migration/phase57-express-endpoints.csv');
 for(const [file,func,router] of cases){
  const path=`${root}/${file}`;assert.ok(existsSync(join(cwd,path)),path);
  const source=read(path);assert.match(source,/export (?:async )?(?:function|const) GET\b/);assert.ok(source.includes(func));
  assert.doesNotMatch(source,/export (?:async )?(?:function|const) (POST|PUT|PATCH|DELETE)\b/);
  const endpoint='/v2/api/'+file.replace(/\/route\.ts$/,'').replace(/\/\[([^\]]+)\]/g,'/:$1');
  assert.ok(inventory.includes(`GET,${endpoint},${router}`)||inventory.includes(`GET,${endpoint}/,${router}`),endpoint);
 }
});
test('each override points to matching original controller method',()=>{
 const controllers={faqRoutes:'faqController',seoPagesRoutes:'seoPagesController',testimonialRoutes:'testimonialController',rolesRoutes:'rolesController',pagesRoutes:'pagesController'};
 for(const [, ,router,method] of cases){
  const source=read(`legacy/sourceindia-express/controllers/${controllers[router.replace('.js','')]}.js`);
  assert.ok(source.includes(`exports.${method} =`),`${router}: ${method}`);
 }
});
test('resource SQL read-only, parameterized, bounded, and uses a whitelisted sort',()=>{
 const source=read('src/lib/localBulk119PublicReads.ts');
 assert.doesNotMatch(source,/(?:\bINSERT\s+INTO|\bDELETE\s+FROM|\bUPDATE\s+\w+\s+SET|\bTRUNCATE\b|\bDROP\s+TABLE|\bSELECT\s+\*)/i);
 assert.match(source,/localAccountDatabase\(\)/);
 assert.match(source,/db\.execute<RowDataPacket\[\]>/);
 assert.match(source,/orderFields\[resource\]\[sortBy\]/);
 assert.match(source,/LIMIT \? OFFSET \?/);
 assert.match(source,/Number\.isSafeInteger/);
 assert.doesNotMatch(source,/legacyExpressBridgeRequest/);
});
test('schema lists required source-model identifiers and joined names',()=>{
 assert.equal(Object.keys(BULK119_TABLES).length,8);
 for(const table of ['faqs','faqcategories','seo_pages','testimonials','upload_images','roles','ticket_categories','pages'])assert.ok(BULK119_TABLES[table]?.length,table);
 assert.ok(BULK119_TABLES.faqs.includes('faq_id'));
 assert.ok(BULK119_TABLES.roles.includes('role_id'));
});
test('previous native API overrides, legacy bridge, and UI are retained',()=>{
 for(const path of ['src/lib/localBulk118PublicReads.ts','src/lib/localLegacyExpressBridge.ts','src/app/v2/api/[...legacy]/route.ts','src/app/v2/api/faqcategories/route.ts','scripts/compare-bulk118-express-next.mjs','src/app/page.tsx']){
  assert.ok(existsSync(join(cwd,path)),path);
 }
});
