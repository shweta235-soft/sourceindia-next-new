import test from 'node:test';
import assert from 'node:assert/strict';
import { issueLocalAuthToken, verifyLocalAuthToken, localAuthSecret, validLocalAccount } from '../src/lib/localAuthToken.ts';
const secret = 'generated-fixture-only-32plus-byte-key!2026';
const account = {id: 2617, email:'buyer@example.test',is_seller:0};
test('secure secret, account and roles must be explicit',()=>{
  assert.equal(localAuthSecret('your_jwt_secret_key'),null);
  assert.equal(localAuthSecret('a'.repeat(50)),null);
  assert.equal(localAuthSecret(secret),secret);
  assert.equal(validLocalAccount({...account, is_seller: '0'}),false);
  assert.equal(validLocalAccount(account),true);
});
test('local tokens verify within their one-hour lifetime',()=>{
  const token = issueLocalAuthToken(account,secret,1700000000);
  assert.equal(verifyLocalAuthToken(token,secret,1700000001)?.id,2617);
  assert.equal(verifyLocalAuthToken(token,secret,1700003600),null);
  assert.equal(verifyLocalAuthToken(token,secret,1699999900),null);
});
test('rejects tampering, key mismatch, invalid JWT structure and missing secret',()=>{
 const token=issueLocalAuthToken(account,secret,1700000000);
 assert.equal(verifyLocalAuthToken(token,secret+'extra',1700000001),null);
 assert.equal(verifyLocalAuthToken(token.replace(/.$/,'A'),secret,1700000001),null);
 assert.equal(verifyLocalAuthToken(token,undefined,1700000001),null);
 assert.equal(verifyLocalAuthToken('x.y.z',secret,1700000001),null);
 assert.equal(verifyLocalAuthToken('a'.repeat(5000),secret),null);
});
test('issuer does not accept invalid account claims',()=>{
 assert.throws(()=>issueLocalAuthToken({...account,id:0},secret), /Invalid local/);
 assert.throws(()=>issueLocalAuthToken({...account,is_seller:2},secret), /Invalid local/);
});
