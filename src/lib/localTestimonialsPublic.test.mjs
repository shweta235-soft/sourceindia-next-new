import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_TESTIMONIAL_LIST, PUBLIC_TESTIMONIAL_COUNT, PUBLIC_TESTIMONIAL_DETAIL,
  parseTestimonialPaging, parseTestimonialId } from './localTestimonialsPublic.ts';

test('default and bounded pagination', () => {
  assert.deepEqual(parseTestimonialPaging('http://localhost/'), { page:1, limit:20, offset:0 });
  assert.deepEqual(parseTestimonialPaging('http://localhost/?page=3&limit=5'), { page:3, limit:5, offset:10 });
});
test('invalid pagination is rejected', () => {
  for (const q of ['page=0', 'limit=51', 'page=-1', 'page=hi', 'limit=2.5', 'page=9999999999'])
    assert.equal(parseTestimonialPaging('http://localhost/?'+q), null);
});
test('validated testimonial IDs', () => {
  assert.equal(parseTestimonialId('12'),12);
  for(const id of ['0','-3','a','1e2','1.5','9007199254740992']) assert.equal(parseTestimonialId(id),null);
});
test('queries use original model physical primary and upload IDs', () => {
  assert.match(PUBLIC_TESTIMONIAL_LIST,/t\.testimonial_id AS id/);
  assert.match(PUBLIC_TESTIMONIAL_LIST,/u\.upload_image_id = t\.file_id/);
  assert.match(PUBLIC_TESTIMONIAL_DETAIL,/t\.testimonial_id = \?/);
});
test('every public query excludes inactive and deleted records', () => {
  for(const sql of [PUBLIC_TESTIMONIAL_LIST,PUBLIC_TESTIMONIAL_DETAIL,PUBLIC_TESTIMONIAL_COUNT]) {
    assert.match(sql,/status = 1/);
    assert.match(sql,/is_delete = 0/);
  }
});
test('queries avoid select star and use placeholders for user data', () => {
  for(const sql of [PUBLIC_TESTIMONIAL_LIST,PUBLIC_TESTIMONIAL_DETAIL]) assert.doesNotMatch(sql,/SELECT\s+\*/i);
  assert.match(PUBLIC_TESTIMONIAL_LIST,/LIMIT \? OFFSET \?/);
  assert.match(PUBLIC_TESTIMONIAL_DETAIL,/testimonial_id = \?/);
});
