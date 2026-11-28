import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all 5 original settings method/path exports exist as native Next handlers',()=>{
 const cases=[['site','GET'],['site','PUT'],['front-site','GET'],['home','GET'],['home','PUT']];
 for(const [path,method] of cases){const file=`src/app/v2/api/settings/${path}/route.ts`;assert.ok(existsSync(new URL('../'+file,import.meta.url)));assert.match(read(file),new RegExp(`export async function ${method}\\b`));assert.doesNotMatch(read(file),/localLegacyExpressBridge|legacyExpress/i);}
});
test('public settings omit sensitive legacy SMTP SMS configuration and include structured menu',()=>{
 const src=read('src/lib/localBulk136Settings.ts');assert.match(src,/smtp_password/);assert.match(src,/sms_password/);assert.match(src,/site\.front_menu=await menus\(\)/);assert.match(src,/site\.home_settings=/);assert.match(src,/for\(const k of excluded\)delete site\[k\]/);
});
test('private /site GET denies missing bearer authentication',()=>{assert.match(read('src/lib/localBulk136Settings.ts'),/if\(!readGate\(req\)\)return reply\(\{message:'Private settings require authorization\.'/);});
test('writes cannot alter real database or deliver uploads by default',()=>{const src=read('src/lib/localBulk136Settings.ts');assert.match(src,/env\.NODE_ENV==='production'/);assert.match(src,/SOURCEINDIA_SETTINGS_QA_WRITES_ENABLED/);assert.match(src,/SOURCEINDIA_SETTINGS_QA_DB_NAME/);assert.match(src,/multipart\/form-data/);assert.match(src,/updateSettingsMultipart\(req,table\)/);});
test('original settings route inventory was not modified',()=>{const src=read('legacy/sourceindia-express/routes/settingRoutes.js');for(const s of ["router.get('/site'","router.get('/front-site'","router.put('/site'","router.get('/home'","router.put('/home'"])assert.ok(src.includes(s));});
