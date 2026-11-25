import test from 'node:test';
import assert from 'node:assert/strict';
import { bearerAuthorization, safeAccountProfile, safeAuthenticationBase } from './accountSession.ts';

test('accepts standard bearer authorization without changing its value', () => {
  assert.equal(bearerAuthorization('Bearer abc.DEF-123_+='), 'Bearer abc.DEF-123_+=');
});

test('rejects missing, malformed, or oversized authorization headers', () => {
  for (const value of [null, '', 'abc', 'Basic secret', 'Bearer ', 'Bearer a b', 'Bearer abc\r\nX-Auth: yes', 'Bearer ' + 'a'.repeat(8190)]) {
    assert.equal(bearerAuthorization(value), null);
  }
});

test('accepts secure upstream API URL and local http development', () => {
  assert.equal(safeAuthenticationBase('https://api.example.com/v2/api')?.href, 'https://api.example.com/v2/api/');
  assert.equal(safeAuthenticationBase('http://localhost:4000/v2/api/')?.href, 'http://localhost:4000/v2/api/');
});

test('rejects insecure external hosts and embedded URL credentials', () => {
  for (const url of ['http://api.example.com/v2/api', 'https://user:pass@api.example.com/', 'https://api.example.com/?token=x', 'https://api.example.com/#fragment', 'javascript:alert(1)', 'not-a-url']) {
    assert.equal(safeAuthenticationBase(url), null);
  }
});

test('returns only approved profile fields and strips sensitive records', () => {
  const profile = safeAccountProfile({ user: { id: 42, fname: 'Buyer', lname: 'Example', email: 'buyer@example.com', is_seller: 0,
    password: 'DO-NOT-EXPOSE', token: 'DO-NOT-EXPOSE', real_password: 'DO-NOT-EXPOSE',
    file: { file: 'avatar.png', internal: 'hidden' }, company_info: { organization_name: 'Acme', bank_account: 'hidden' },
    status: 1, company_id: 2 } });
  assert.deepEqual(profile, { id: 42, fname: 'Buyer', lname: 'Example', email: 'buyer@example.com', is_seller: 0,
    status: 1, file: { file: 'avatar.png' }, company_info: { organization_name: 'Acme' }, company_id: 2 });
});

test('rejects missing or invalid upstream user IDs', () => {
  for (const payload of [null, {}, { user: null }, { user: [] }, { user: { id: 0 } }, { user: { id: -1 } },
    { user: { id: '0' } }, { user: { id: 'not-a-number' } }, { user: { id: 1.25 } }]) {
    assert.equal(safeAccountProfile(payload), null);
  }
});

test('supports an upstream numeric-string account ID', () => {
  assert.deepEqual(safeAccountProfile({ user: { id: '123', email: 'buyer@example.com' } }), { id: '123', email: 'buyer@example.com' });
});
