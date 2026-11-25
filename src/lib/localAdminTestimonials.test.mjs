import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADMIN_TESTIMONIAL_LIST,ADMIN_TESTIMONIAL_COUNT,ADMIN_TESTIMONIAL_DETAIL,ADMIN_TESTIMONIAL_STATUS_UPDATE,adminTestimonialId,adminTestimonialPaging,adminTestimonialDeleted,adminTestimonialStatus} from './localAdminTestimonials.ts';
test('admin paging validates bounds',()=>{
 assert.deepEqual(adminTestimonialPaging('http://localhost/'),{page:1,limit:20,offset:0});
 assert.deepEqual(adminTestimonialPaging('http://localhost/?page=2&limit=5'),{page:2,limit:5,offset:5});
 for(const q of ['page=0','limit=51','page=x','limit=-1']) assert.equal(adminTestimonialPaging('http://localhost/?'+q),null);
});
test('admin ID and deleted filter validation',()=>{
 assert.equal(adminTestimonialId('7'),7);
 for(const x of ['0','-1','abc','9007199254740992'])assert.equal(adminTestimonialId(x),null);
 assert.equal(adminTestimonialDeleted('http://localhost/'),0);
 assert.equal(adminTestimonialDeleted('http://localhost/?deleted=1'),1);
 assert.equal(adminTestimonialDeleted('http://localhost/?deleted=all'),null);
});
test('strict status payload',()=>{
 assert.equal(adminTestimonialStatus({status:0}),0);
 assert.equal(adminTestimonialStatus({status:1}),1);
 for(const x of [{status:'1'},{status:2},{status:1,id:7},null,[]]) assert.equal(adminTestimonialStatus(x),null);
});
test('schema fields and SQL placeholders match Sequelize model',()=>{
 assert.match(ADMIN_TESTIMONIAL_LIST,/t\.testimonial_id AS id/);
 assert.match(ADMIN_TESTIMONIAL_LIST,/u\.upload_image_id = t\.file_id/);
 assert.match(ADMIN_TESTIMONIAL_LIST,/LIMIT \? OFFSET \?/);
 assert.match(ADMIN_TESTIMONIAL_DETAIL,/t\.testimonial_id = \?/);
 assert.match(ADMIN_TESTIMONIAL_STATUS_UPDATE,/WHERE testimonial_id = \? AND is_delete = 0/);
 assert.match(ADMIN_TESTIMONIAL_COUNT,/is_delete = \?/);
});
test('write disabled unless explicit opt-in and authenticated',()=>{
 const src=readFileSync(new URL('../app/admin/api/local/testimonials/[id]/route.ts',import.meta.url),'utf8');
 assert.match(src,/authorizedAdminFaq\(req\)/);
 assert.match(src,/adminFaqSameOrigin\(req\)/);
 assert.match(src,/LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED/);
 assert.match(src,/!==\s*'true'/);
});
test('proxy blocks anonymous Admin testimonial routes with 401',()=>{
 const src=readFileSync(new URL('../proxy.ts',import.meta.url),'utf8');
 assert.match(src,/pathname\.startsWith\("\/admin\/api\/local\/testimonials\/"\)/);
 assert.match(src,/status: 401/);
});
