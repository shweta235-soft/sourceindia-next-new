import test from 'node:test';
import assert from 'node:assert/strict';
import { bearerAuthorization, safeAccountProfile, safeAuthenticationBase } from '../src/lib/accountSession.ts';

test('rejects missing, malformed, oversized and header-injection tokens', () => {
  assert.equal(bearerAuthorization(null), null);
  assert.equal(bearerAuthorization('Basic xyz'), null);
  assert.equal(bearerAuthorization('Bearer abc\nFake: x'), null);
  assert.equal(bearerAuthorization('Bearer '+ 'a'.repeat(8200)), null);
  assert.equal(bearerAuthorization('Bearer abc.def-XYZ_123'), 'Bearer abc.def-XYZ_123');
});
test('profile projection is allowlisted even when legacy response contains password and OTP', () => {
  const result = safeAccountProfile({user:{id:42, fname:'Buyer', email:'test@example.com', password:'secret', real_password:'raw', otp:'000000',company_info:{ organization_name:'Company', gst:'hidden' }}});
  assert.deepEqual(result,{id:42,fname:'Buyer',email:'test@example.com',company_info:{organization_name:'Company'}});
  assert.equal(safeAccountProfile({user:{email:'test@example.com'}}), null);
  assert.equal(safeAccountProfile({user:null}), null);
});
test('authentication base must be https except localhost development', () => {
  assert.equal(safeAuthenticationBase('http://bad.example.com/api'),null);
  assert.equal(safeAuthenticationBase('https://user:pass@example.com/api'),null);
  assert.equal(safeAuthenticationBase('https://example.com/api?token=a'),null);
  assert.equal(safeAuthenticationBase('https://example.com/api')?.href,'https://example.com/api/');
  assert.equal(safeAuthenticationBase('http://localhost:4000/api')?.protocol,'http:');
});
