import test from 'node:test';
import assert from 'node:assert/strict';
import {BULK101_SQL,bulk101Id,bulk101Paging,bulk101Slug} from './localBulk101Reads.ts';
test('physical model primary keys',()=>{for(const key of ['seoList','seoDetail','seoSlug'])assert.match(BULK101_SQL[key],/seo_page_id/);for(const key of ['ticketsAdmin','ticketsPublic'])assert.match(BULK101_SQL[key],/ticket_category_id/);for(const key of ['interestsAdmin','interestsPublic'])assert.match(BULK101_SQL[key],/interest_category_id/);});
test('public categories filter active',()=>{for(const key of ['ticketsPublic','ticketsPublicCount','ticketsPublicDetail','interestsPublic','interestsPublicCount','interestsPublicDetail'])assert.match(BULK101_SQL[key],/status = 1/);});
test('public ticket email excluded',()=>{for(const key of ['ticketsPublic','ticketsPublicDetail'])assert.doesNotMatch(BULK101_SQL[key],/email/);assert.match(BULK101_SQL.ticketsAdmin,/email/);});
test('SQL is read only',()=>{for(const sql of Object.values(BULK101_SQL)){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\b(?:UPDATE|INSERT|DELETE|DROP)\b/);}});
test('IDs, paging and slugs validated',()=>{assert.equal(bulk101Id('3'),3);assert.equal(bulk101Id('-1'),null);assert.equal(bulk101Id('1e3'),null);assert.equal(bulk101Id('0'),null);assert.equal(bulk101Slug('foo'), 'foo');assert.equal(bulk101Slug(''),null);assert.equal(bulk101Paging('http://localhost/?page=2&limit=10').offset,10);assert.equal(bulk101Paging('http://localhost/?limit=51'),null);});
