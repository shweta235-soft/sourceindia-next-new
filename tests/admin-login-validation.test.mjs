import test from 'node:test';
import assert from 'node:assert/strict';
import { adminUpstreamExpiry, validUpstreamAdminId } from '../src/lib/adminLoginValidation.ts';
const now = 1700000000;
const token = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.c2lnbmF0dXJl`;
test('admin IDs only accept positive safe numeric identifiers', () => {
  assert.equal(validUpstreamAdminId(123), '123');
  assert.equal(validUpstreamAdminId('123'), '123');
  for (const x of [0, -1, 1.2, NaN, Number.MAX_SAFE_INTEGER + 1, 'admin', '0', '1 OR 1=1', null])
    assert.equal(validUpstreamAdminId(x), null);
});
test('expiry must be a valid future integer from correctly encoded token', () => {
  assert.equal(adminUpstreamExpiry(token({exp:now+500}), now), now+500);
  for (const x of [now, now-1, 1.25, '1700000500', null, Number.MAX_SAFE_INTEGER+1])
    assert.equal(adminUpstreamExpiry(token({exp:x}), now), null);
  for (const x of ['abc', 'a.b', 'a.b.c.d', 'a.!.c', token({exp:now+5}) + '.x', 'x'.repeat(9000)])
    assert.equal(adminUpstreamExpiry(x, now), null);
});
