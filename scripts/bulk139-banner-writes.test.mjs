import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const core=readFileSync('src/lib/localBulk138HomeBanners.ts','utf8');
const write=readFileSync('src/lib/localBulk139BannerWrites.ts','utf8');
const route=readFileSync('src/app/upload/home_banners/[filename]/route.ts','utf8');
test('all three write methods delegate through existing QA auth gate',()=>{
 assert.match(core,/bannerPost\(req:NextRequest\)[\s\S]*?bannerQaGate\(req\)[\s\S]*?createQaBanner\(req\)/);
 assert.match(core,/bannerPut\(req:NextRequest,[\s\S]*?bannerQaGate\(req\)[\s\S]*?updateQaBanner\(req,/);
 assert.match(core,/bannerDelete\(req:NextRequest,[\s\S]*?bannerQaGate\(req\)[\s\S]*?deleteQaBanner\(req,/);
});
test('write endpoints require isolated QA DB and protected QA image root',()=>{
 assert.match(core,/SOURCEINDIA_BANNERS_QA_DB_NAME/);
 assert.match(write,/SOURCEINDIA_BANNERS_QA_STORAGE_ROOT/);
 assert.match(write,/\(qa\|test\|sandbox\)/);
 assert.match(write,/QA-owned; refusing/);
});
test('image validation, size caps, UUID ownership, and file safety are present',()=>{
 for(const token of ['MAX_IMAGE','MAX_FORM','imageSignature','randomUUID','flag:\'wx\'','ownedFilePath','basename(filename)'])assert.ok(write.includes(token),token);
 assert.match(write,/multipart\/form-data/);
 assert.match(write,/await req\.formData\(\)/);
});
test('create/update/delete use DB transactions and cleanup',()=>{
 for(const token of ['beginTransaction','commit()','rollback()','removeSafely','FOR UPDATE','INSERT INTO upload_images','INSERT INTO home_banners','DELETE FROM upload_images'])assert.ok(write.includes(token),token);
 assert.match(write,/Shared image cannot be deleted/);
});
test('QA image-serving route exists and content type checked',()=>{
 assert.match(route,/serveQaBanner/);
 assert.match(write,/X-Content-Type-Options/);
 assert.ok(existsSync('src/app/upload/home_banners/[filename]/route.ts'));
});
