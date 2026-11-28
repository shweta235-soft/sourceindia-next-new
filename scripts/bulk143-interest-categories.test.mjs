import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync('src/lib/localBulk143InterestCategories.ts','utf8');
const parts=[['route.ts',['GET','POST']],['count/route.ts',['GET']],['server-side/route.ts',['GET']],['[id]/route.ts',['GET','PUT','DELETE']],['[id]/status/route.ts',['PATCH']]];
test('BULK143 all 8 original method/path signatures',()=>{
 const route=readFileSync('legacy/sourceindia-express/routes/interestCategoriesRoutes.js','utf8');
 assert.equal((route.match(/router\.(?:get|post|put|delete|patch)\(/g)||[]).length,8);
 let count=0;for(const [path,methods] of parts){const file='src/app/v2/api/interest_categories/'+path;assert.ok(existsSync(file),file);const raw=readFileSync(file,'utf8');for(const method of methods){assert.match(raw,new RegExp('export (?:async )?function '+method+'\\('));count++;}}assert.equal(count,8);
});
test('BULK143 native core includes all 8 handlers',()=>{for(const fn of ['listInterestCategories','interestCategoriesCount','getInterestCategory','interestCategoriesServerSide','createInterestCategory','updateInterestCategory','deleteInterestCategory','updateInterestCategoryStatus'])assert.match(source,new RegExp('export async function '+fn+'\\('));});
test('BULK143 QA-only writes and transactional image safety',()=>{for(const fragment of ['NODE_ENV===\'production\'','SOURCEINDIA_INTEREST_CATEGORIES_QA_DB_NAME','SOURCEINDIA_INTEREST_CATEGORIES_QA_STORAGE_ROOT','timingSafeEqual','beginTransaction','rollback','commit','imageOwned','validImage','writeFile','unlink','MAX_FILE'])assert.ok(source.includes(fragment),fragment);for(const fn of ['createInterestCategory','updateInterestCategory','deleteInterestCategory','updateInterestCategoryStatus'])assert.match(source.slice(source.indexOf('export async function '+fn)),/interestCategoriesQaGate\(req\)/);});
test('BULK143 original reference and joined response shape',()=>{const legacy=readFileSync('legacy/sourceindia-express/controllers/interestCategoriesController.js','utf8');for(const name of ['getAllInterestCategories','getInterestCategoriesById','getAllInterestCategoriesServerSide','createInterestCategories','deleteInterestCategories'])assert.ok(legacy.includes(name));for(const fragment of ['UploadImage','file_name','color_name','totalRecords','filteredRecords','getInterestCategory'])assert.ok(source.includes(fragment));});
