import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('./localEnquiryDetailRead.ts', import.meta.url), 'utf8');
const handler = readFileSync(new URL('./localEnquiryDetailHandler.ts', import.meta.url), 'utf8');
for (const table of ['enquiries', 'enquiry_users', 'buyerenquiry']) {
  test(`correct table: ${table}`, () => assert.match(sql, new RegExp(table)));
}
test('exact owner scoping for sent and buyer messages', () => {
 assert.match(sql, /e\.user_id = \?/);
 assert.match(sql, /b\.user_id = \?/);
 assert.match(sql, /b\.reciever_id = \?/);
});
test('received detail checks seller company assignment', () => {
 assert.match(sql, /EXISTS/);
 assert.match(sql, /eu\.company_id = \?/);
 assert.match(sql, /eu\.is_delete = 0/);
 assert.match(handler, /account\.is_seller !== 1/);
});
test('never SELECT * or mutate data', () => {
 assert.doesNotMatch(sql, /SELECT\s+\*/i);
 assert.doesNotMatch(sql, /\b(?:INSERT|DELETE|UPDATE)\s/i);
});
test('authenticated fresh local session', () => {
 assert.match(handler, /verifyLocalAuthToken/);
 assert.match(handler, /accountById\(claims\.id\)/);
});
test('privacy and not-found behavior', () => {
 assert.match(handler, /private, no-store/);
 assert.match(handler, /fail\(404, 'Record not found\.'\)/);
});
test('safe ID and strictly parameterized owner query', () => {
 assert.match(sql, /Number\.isSafeInteger/);
 assert.match(handler, /\[id, ownerId\]/);
});
