import test from 'node:test';
import assert from 'node:assert/strict';
import { issueLocalAuthToken, verifyLocalAuthToken, localAuthSecret, validLocalAccount } from './localAuthToken.ts';

const secret = 'phase59-test-only-key-not-for-production-8yE9tZ4a';
const otherSecret = 'phase59-different-key-not-for-production-j7M4sT2k';
const account = { id: 101, email: 'test-buyer@example.com', is_seller: 0 };
const now = 1_800_000_000;

test('issues a verifiable 1-hour JWT with expected account claims', () => {
  const token = issueLocalAuthToken(account, secret, now);
  const claims = verifyLocalAuthToken(token, secret, now);
  assert.ok(claims);
  assert.equal(claims.id, account.id);
  assert.equal(claims.email, account.email);
  assert.equal(claims.is_seller, account.is_seller);
  assert.equal(claims.iss, 'sourceindia-next');
  assert.equal(claims.aud, 'sourceindia-account');
  assert.equal(claims.exp - claims.iat, 3600);
});

test('rejects token after its expiration', () => {
  const token = issueLocalAuthToken(account, secret, now);
  assert.equal(verifyLocalAuthToken(token, secret, now + 3600), null);
});

test('rejects a token with tampered payload', () => {
  const token = issueLocalAuthToken(account, secret, now);
  const [header, payload, signature] = token.split('.');
  const changed = { ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')), id: 999 };
  const tampered = [header, Buffer.from(JSON.stringify(changed)).toString('base64url'), signature].join('.');
  assert.equal(verifyLocalAuthToken(tampered, secret, now), null);
});

test('rejects token verified with a different secret', () => {
  const token = issueLocalAuthToken(account, secret, now);
  assert.equal(verifyLocalAuthToken(token, otherSecret, now), null);
});

test('rejects missing or placeholder signing secrets', () => {
  assert.equal(localAuthSecret(undefined), null);
  assert.equal(localAuthSecret('change-me-for-production-please-12345'), null);
  assert.throws(() => issueLocalAuthToken(account, 'short', now));
});

test('rejects malformed or invalid account claims', () => {
  assert.equal(validLocalAccount({ id: 0, email: account.email, is_seller: 0 }), false);
  assert.equal(validLocalAccount({ id: 1, email: 'not-an-email', is_seller: 0 }), false);
  assert.equal(validLocalAccount({ id: 1, email: account.email, is_seller: 2 }), false);
  assert.throws(() => issueLocalAuthToken({ id: -1, email: account.email, is_seller: 0 }, secret, now));
});

test('rejects invalid token formats and future-issued tokens', () => {
  assert.equal(verifyLocalAuthToken('invalid.jwt', secret, now), null);
  assert.equal(verifyLocalAuthToken('', secret, now), null);
  const future = issueLocalAuthToken(account, secret, now + 60);
  assert.equal(verifyLocalAuthToken(future, secret, now), null);
});
