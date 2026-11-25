import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTestimonialWrite,TESTIMONIAL_CREATE,TESTIMONIAL_EDIT,TESTIMONIAL_SOFT_DELETE,TESTIMONIAL_IMAGE_EXISTS,newTestimonialUuid} from './localAdminTestimonialWrite.ts';
const valid={name:'  Good work  ',description:'  Positive experience  ',status:1,file_id:7};
test('strict and normalized create/edit payload',()=>{
  assert.deepEqual(parseTestimonialWrite(valid),{name:'Good work',description:'Positive experience',status:1,file_id:7});
  assert.equal(parseTestimonialWrite({...valid,status:0})?.status,0);
  for(const x of [null,[],{}, {...valid,status:'1'},{...valid,status:2},{...valid,file_id:0},{...valid,file_id:'7'},{...valid,name:' '},{...valid,description:''},{...valid,name:'x'.repeat(256)},{...valid,extra:1}])assert.equal(parseTestimonialWrite(x),null);
});
test('writes are parameterized and only soft-delete',()=>{
  assert.match(TESTIMONIAL_CREATE,/INSERT INTO testimonials.*VALUES \(\?,\?,\?,\?,\?,0,NOW\(\),NOW\(\)\)/s);
  assert.match(TESTIMONIAL_EDIT,/WHERE testimonial_id=\? AND is_delete=0/);
  assert.match(TESTIMONIAL_SOFT_DELETE,/SET is_delete=1/);
  assert.doesNotMatch(TESTIMONIAL_SOFT_DELETE,/DELETE FROM/i);
  assert.match(TESTIMONIAL_IMAGE_EXISTS,/upload\/testimonials\//);
  assert.match(newTestimonialUuid(),/^[0-9a-f-]{36}$/);
});
test('handlers gate all writes on signed Admin session, origin and flag',()=>{
  const http=readFileSync(new URL('./localAdminTestimonialWriteHttp.ts',import.meta.url),'utf8');
  assert.match(http,/authorizedAdminFaq\(req\)/);
  assert.match(http,/adminFaqSameOrigin\(req\)/);
  assert.match(http,/LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED/);
  assert.match(http,/!==\s*'true'/);
  const base=readFileSync(new URL('../app/admin/api/local/testimonials/route.ts',import.meta.url),'utf8');
  const detail=readFileSync(new URL('../app/admin/api/local/testimonials/[id]/route.ts',import.meta.url),'utf8');
  assert.match(base,/export async function POST/);
  assert.match(detail,/export async function PUT/);
  assert.match(detail,/export async function DELETE/);
  assert.equal((base+detail).match(/denyTestimonialWrite\(req\)/g)?.length,3);
});
test('HTTP body size and content type are restricted',()=>{
  const src=readFileSync(new URL('./localAdminTestimonialWriteHttp.ts',import.meta.url),'utf8');
  assert.match(src,/application\/json/);
  assert.match(src,/35000/);
});
