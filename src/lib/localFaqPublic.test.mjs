import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFaqPaging,parseFaqId,PUBLIC_FAQ_LIST,PUBLIC_FAQ_COUNT,PUBLIC_FAQ_DETAIL,PUBLIC_FAQ_CATEGORIES} from './localFaqPublic.ts';
test('default paging and bounded explicit paging',()=>{
 assert.deepEqual(parseFaqPaging('http://localhost/api/local/faqs'),{page:1,limit:20,offset:0});
 assert.deepEqual(parseFaqPaging('http://localhost/api/local/faqs?page=3&limit=10'),{page:3,limit:10,offset:20});
});
test('malformed pagination rejected',()=>{
 for(const s of ['page=0','limit=51','page=-1','page=abc','limit=1.5','page=9999999999']) assert.equal(parseFaqPaging('http://localhost/?'+s),null);
});
test('FAQ ID validation',()=>{
 assert.equal(parseFaqId('21'),21);
 for(const s of ['0','-1','x','1.0','1e3','9007199254740992']) assert.equal(parseFaqId(s),null);
});
test('queries use physical model column names',()=>{
 assert.match(PUBLIC_FAQ_LIST,/f\.faq_id AS id/);
 assert.match(PUBLIC_FAQ_CATEGORIES,/faqcategory_id AS id/);
 assert.match(PUBLIC_FAQ_DETAIL,/f\.faq_id = \?/);
});
test('public FAQs exclude inactive and deleted records',()=>{
 for(const sql of [PUBLIC_FAQ_LIST,PUBLIC_FAQ_DETAIL,PUBLIC_FAQ_COUNT]) {
  assert.match(sql,/status = 1/);
  assert.match(sql,/is_delete = 0/);
 }
});
test('list uses placeholders for pagination',()=>{
 assert.match(PUBLIC_FAQ_LIST,/LIMIT \? OFFSET \?/);
});
