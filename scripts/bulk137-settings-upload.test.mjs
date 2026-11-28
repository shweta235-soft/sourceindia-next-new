import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {settingsImageType,settingsQaRoot,settingsOwnedDbPath,settingsOwnedFilename,settingsImageMime,SETTINGS_MULTIPART_MAX_BYTES,SETTINGS_IMAGE_MAX_BYTES} from '../src/lib/localBulk137SettingsImages.mjs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const jpg=Uint8Array.from([255,216,255,224,0,16,74,70,73,70]);
const webp=Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]);
const gif=Uint8Array.from([71,73,70,56,57,97,0,0]);
const ico=Uint8Array.from([0,0,1,0,1,0,0,0]);
test('actual byte-signature validation covers five UI-accepted image formats plus favicon ICO',()=>{
 for(const [name,mime,bytes] of [['logo.png','image/png',png],['logo.jpg','image/jpeg',jpg],['logo.webp','image/webp',webp],['logo.gif','image/gif',gif],['favicon.ico','image/x-icon',ico]]){
  assert.ok(settingsImageType(name,mime,bytes),`${name} should pass`);
 }
});
test('reject extension/MIME mismatch, SVG, fake images, empty files and oversize files',()=>{
 assert.equal(settingsImageType('banner.jpg','image/jpeg',png),null);
 assert.equal(settingsImageType('banner.png','image/svg+xml',png),null);
 assert.equal(settingsImageType('bad.svg','image/svg+xml',png),null);
 assert.equal(settingsImageType('bad.png','image/png',new Uint8Array(20)),null);
 assert.equal(settingsImageType('empty.png','image/png',new Uint8Array(0)),null);
 assert.equal(settingsImageType('big.png','image/png',new Uint8Array(SETTINGS_IMAGE_MAX_BYTES+1)),null);
 assert.equal(SETTINGS_IMAGE_MAX_BYTES,2097152);
 assert.equal(SETTINGS_MULTIPART_MAX_BYTES,16777216);
});
test('QA root accepts only isolated absolute QA/test/sandbox paths',()=>{
 assert.equal(settingsQaRoot('relative/settings-qa'),null);
 assert.equal(settingsQaRoot(resolve('/')),null);
 assert.equal(settingsQaRoot(resolve('/tmp/ordinary-production')),null);
 assert.equal(settingsQaRoot(resolve('/tmp/sourceindia-settings-qa')),resolve('/tmp/sourceindia-settings-qa'));
});
test('only UUID-created image paths may be replaced or served',()=>{
 const good='a1b2c3d4-e5f6-4abc-8def-1234567890ab.png';
 assert.ok(settingsOwnedFilename(good));
 assert.ok(settingsOwnedDbPath('upload/siteSettings/'+good));
 assert.equal(settingsImageMime(good),'image/png');
 for(const bad of ['../../.env.local','../a.png','logo.png','a1b2c3d4-e5f6-4abc-8def-1234567890ab.svg'])assert.ok(!settingsOwnedFilename(bad));
 assert.ok(!settingsOwnedDbPath('upload/users/'+good));
});
test('both existing PUT routes delegate to guarded settings core and then multipart logic',()=>{
 const site=source('src/app/v2/api/settings/site/route.ts');
 const home=source('src/app/v2/api/settings/home/route.ts');
 const gate=source('src/lib/localBulk136Settings.ts');
 const upload=source('src/lib/localBulk137SettingsUploads.ts');
 assert.match(site,/updateSettings\(req,'site_settings'\)/);
 assert.match(home,/updateSettings\(req,'home_settings'\)/);
 assert.ok(gate.indexOf('const denied=writeGate(req)')<gate.indexOf('return updateSettingsMultipart(req,table)'));
 assert.match(gate,/env.NODE_ENV==='production'/);
 assert.match(gate,/SOURCEINDIA_SETTINGS_QA_WRITES_ENABLED/);
 assert.match(gate,/SOURCEINDIA_SETTINGS_QA_DB_NAME/);
 assert.match(upload,/SOURCEINDIA_SETTINGS_QA_STORAGE_ROOT/);
 assert.match(upload,/formData\(\)/);
 assert.match(upload,/await conn.beginTransaction\(\)/);
 assert.match(upload,/await conn.commit\(\)/);
 assert.match(upload,/await conn.rollback\(\)/);
 assert.match(upload,/flag:'wx'/);
 assert.match(upload,/popup_banner_session_id=randomUUID\(\)/);
 assert.match(upload,/await unlink\(f\)/);
});
test('site/home upload field maps match Express and QA serving route exists',()=>{
 const upload=source('src/lib/localBulk137SettingsUploads.ts');
 for(const field of ['logo_file','favicon_file','about_file','footer_logo','footer_img_1','footer_img_2','popup_banner_file'])assert.match(upload,new RegExp(`name:'${field}'`));
 assert.ok(existsSync(new URL('../src/app/upload/siteSettings/[filename]/route.ts',import.meta.url)));
 const legacy=source('legacy/sourceindia-express/routes/settingRoutes.js');
 for(const exact of ["router.put('/site'","router.put('/home'"])assert.ok(legacy.includes(exact));
});
test('BULK136 public GET and original site settings privacy protections preserved',()=>{
 const baseline=source('src/lib/localBulk136Settings.ts');
 assert.match(baseline,/for\(const k of excluded\)delete site\[k\]/);
 assert.match(baseline,/if\(!readGate\(req\)\)/);
 assert.match(source('src/app/v2/api/settings/front-site/route.ts'),/getFrontSite/);
});
