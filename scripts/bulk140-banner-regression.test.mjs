/** BULK140: non-mutating source regression; does not connect to DB or send writes. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const source=(p)=>readFileSync(resolve(p),'utf8');
const core=source('src/lib/localBulk138HomeBanners.ts');
const writes=source('src/lib/localBulk139BannerWrites.ts');
const methods=[
 ['POST','src/app/v2/api/home_banners/route.ts','bannerPost'],
 ['PUT','src/app/v2/api/home_banners/[id]/route.ts','bannerPut'],
 ['DELETE','src/app/v2/api/home_banners/[id]/route.ts','bannerDelete'],
 ['PATCH','src/app/v2/api/home_banners/[id]/status/route.ts','bannerToggle'],
 ['PATCH','src/app/v2/api/home_banners/[id]/delete_status/route.ts','bannerToggle'],
 ['DELETE','src/app/v2/api/home_banners/delete-selected/route.ts','bannerDeleteSelected'],
];
test('all six mutation methods have native route handlers',()=>{
 for(const [method,path,handler] of methods){const route=source(path);assert.match(route,new RegExp('export\\s+(?:async\\s+)?function\\s+'+method+'\\b|export\\s*\\{[^}]*\\b'+method+'\\b'),`${method} ${path}`);assert.ok(core.includes(handler),`${path}: missing ${handler}`);}
});
test('each mutation delegates through QA authorization gate first',()=>{
 for(const name of ['bannerPost','bannerPut','bannerDelete','bannerToggle','bannerDeleteSelected']){
  const start=core.indexOf(`export async function ${name}(`);assert.ok(start>=0,name);
  const body=core.slice(start,core.indexOf('export async function ',start+10)<0?core.length:core.indexOf('export async function ',start+10));
  assert.ok(body.includes('bannerQaGate(req)'),name+': QA gate missing');
 }
});
test('QA gate rejects production and mismatched or non-local database configurations',()=>{
 for(const token of ["env.NODE_ENV==='production'","SOURCEINDIA_BANNERS_QA_WRITES_ENABLED","SOURCEINDIA_BANNERS_QA_DB_NAME","localhost","127.0.0.1","timingSafeEqual","QA authorization required."]){assert.ok(core.includes(token),token);}
});
test('QA image root and legacy-image ownership checks remain present',()=>{
 for(const token of ['SOURCEINDIA_BANNERS_QA_STORAGE_ROOT','isAbsolute(raw)','ownedFilePath(rows[0].file)','QA-owned; refusing','randomUUID()',"flag:'wx'",'imageSignature'])assert.ok(writes.includes(token),token);
});
test('transactions, shared-image protection and rollback remain present',()=>{
 for(const token of ['beginTransaction()','commit()','rollback()','Shared image cannot be deleted','removeSafely','FOR UPDATE','DELETE FROM upload_images'])assert.ok(writes.includes(token),token);
});
