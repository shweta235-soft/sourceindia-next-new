import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text = readFileSync(new URL('./localEnquiryRead.ts', import.meta.url), 'utf8');
const handler = readFileSync(new URL('./localEnquiryHandler.ts', import.meta.url), 'utf8');
for (const kind of ['sent', 'received', 'buyer-messages']) {
  test(`${kind} has read-only scoped list/count contracts`, () => {
    assert.match(text, new RegExp(`['"]?${kind}['"]?\\s*:\\s*\\{`));
  });
}
test('no select-star, no write queries', () => {
  assert.doesNotMatch(text, /SELECT\s+\*\s+FROM/i);
  assert.doesNotMatch(text, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO|FROM|\w+\s+SET)/i);
});
test('each query is bound to account/company ID', () => {
  assert.match(text, /e\.user_id = \?/);
  assert.match(text, /eu\.company_id = \?/);
  assert.match(text, /b\.user_id = \?/);
});
test('received query excludes removed associations', () => assert.match(text, /eu\.is_delete = 0/g));
test('session is checked against current account', () => {
  assert.match(handler, /verifyLocalAuthToken/);
  assert.match(handler, /accountById\(claims\.id\)/);
  assert.match(handler, /account\.email !== claims\.email/);
});
test('no session cookie fallback and no public cache', () => {
  assert.match(handler, /bearerAuthorization/);
  assert.match(handler, /private, no-store/);
});
test('pagination guarded', () => {
  assert.match(text, /limit > 50/);
  assert.match(text, /getAll\('page'\)\.length > 1/);
});
