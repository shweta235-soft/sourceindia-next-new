import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveNewsletterHistoryIdentity,newsletterHistoryIdExpression} from '../src/lib/localBulk108HistoryIdentity.mjs';
import {BULK108_TABLES} from './bulk108-schema.mjs';
const c=(name,key='PRI',type='int')=>({COLUMN_NAME:name,COLUMN_KEY:key,DATA_TYPE:type});
test('History preflight checks required data columns without assuming legacy physical ID',()=>{
 assert.ok(BULK108_TABLES.news_latter_histories.includes('newsLatter_id'));
 assert.ok(!BULK108_TABLES.news_latter_histories.includes('newsletter_history_id'));
 const preflight=readFileSync(new URL('./test-local-bulk108-db-preflight.mjs',import.meta.url),'utf8');
 assert.match(preflight,/resolveNewsletterHistoryIdentity\(actual\)/);
 assert.match(preflight,/INFORMATION_SCHEMA\.COLUMNS/);
 assert.doesNotMatch(preflight,/(ALTER\s+TABLE|DROP\s+TABLE|UPDATE\s+news_latter_histories|INSERT\s+INTO)/i);
});
test('History identity uses physical legacy PK if present',()=>{
 assert.equal(resolveNewsletterHistoryIdentity([c('newsletter_history_id')]),'newsletter_history_id');
 assert.equal(newsletterHistoryIdExpression('newsletter_history_id'),'h.`newsletter_history_id`');
});
test('History identity accepts deployed renamed single-column integer PK',()=>{
 assert.equal(resolveNewsletterHistoryIdentity([c('id'),c('user_id','MUL')]),'id');
 assert.equal(resolveNewsletterHistoryIdentity([c('id','UNI'),c('user_id','MUL')]),'id');
 assert.equal(newsletterHistoryIdExpression('id'),'h.`id`');
});
test('History identity permits actual unique uuid only as fallback',()=>{
 assert.equal(resolveNewsletterHistoryIdentity([c('uuid','UNI','char')]),'uuid');
 assert.equal(resolveNewsletterHistoryIdentity([c('uuid','MUL','varchar')]),null);
});
test('History identity fails closed for nonunique, composite or tampered columns',()=>{
 assert.equal(resolveNewsletterHistoryIdentity([c('user_id','MUL')]),null);
 assert.equal(resolveNewsletterHistoryIdentity([c('a'),c('b')]),null);
 assert.equal(resolveNewsletterHistoryIdentity([c('name','PRI','text')]),null);
 assert.equal(resolveNewsletterHistoryIdentity([c('id`; DROP TABLE users; --')]),null);
 assert.throws(()=>newsletterHistoryIdExpression('id; DROP TABLE users'));
});
test('History reporting selects the metadata-derived identity instead of hardcoded legacy PK',()=>{
 const reports=readFileSync(new URL('../src/lib/localBulk108Reports.ts',import.meta.url),'utf8');
 assert.match(reports,/resolveNewsletterHistoryIdentity\(keyRows\)/);
 assert.match(reports,/newsletterHistoryIdExpression\(key\)/);
 assert.match(reports,/sorts\.id=idSql/);
 assert.doesNotMatch(reports,/h\.newsletter_history_id/);
});
