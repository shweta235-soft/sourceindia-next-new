import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const main=readFileSync(join(root,'src/lib/localBulk138HomeBanners.ts'),'utf8');
const signatures=[
 ['src/app/v2/api/home_banners/route.ts','GET','listBanners'],
 ['src/app/v2/api/home_banners/route.ts','POST','bannerPost'],
 ['src/app/v2/api/home_banners/count/route.ts','GET','bannerCount'],
 ['src/app/v2/api/home_banners/server-side/route.ts','GET','bannerServerSide'],
 ['src/app/v2/api/home_banners/[id]/route.ts','GET','getBanner'],
 ['src/app/v2/api/home_banners/[id]/route.ts','PUT','bannerPut'],
 ['src/app/v2/api/home_banners/[id]/route.ts','DELETE','bannerDelete'],
 ['src/app/v2/api/home_banners/delete-selected/route.ts','DELETE','bannerDeleteSelected'],
 ['src/app/v2/api/home_banners/[id]/status/route.ts','PATCH','bannerToggle'],
 ['src/app/v2/api/home_banners/[id]/delete_status/route.ts','PATCH','bannerToggle'],
];
test('BULK138: all 10 original method/path signatures have native handlers',()=>{
 for(const [file,method,handler] of signatures){const full=join(root,file);assert.ok(existsSync(full),file);const body=readFileSync(full,'utf8');assert.match(body,new RegExp('export async function '+method+'\\('));assert.ok(body.includes(handler));}
});
test('BULK138: all mutations checked before any write',()=>{
 for(const fn of ['bannerPost','bannerPut','bannerDelete','bannerDeleteSelected','bannerToggle']){
  const section=main.slice(main.indexOf('export async function '+fn),main.indexOf('export async function '+fn)+300);
  assert.match(section,/bannerQaGate\(req\)/,fn);
 }
});
test('BULK138: no unsafe production write enablement',()=>{
 assert.match(main,/env.NODE_ENV==='production'/);
 assert.match(main,/SOURCEINDIA_BANNERS_QA_DB_NAME/);
 assert.match(main,/timingSafeEqual/);
 assert.match(main,/export async function bannerDelete\(/);
 assert.match(main,/return deleteQaBanner\(req,id\)/);
});
test('BULK138: response shapes preserve original banner keys',()=>{
 for(const name of ['file_name','getStatus','totalRecords','filteredRecords','Home Banner not found'])assert.ok(main.includes(name),name);
});
