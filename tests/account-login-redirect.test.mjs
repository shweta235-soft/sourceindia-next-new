import test from 'node:test';
import assert from 'node:assert/strict';
import { accountLoginDestination, accountLoginReturnTarget } from '../src/lib/accountLoginRedirect.ts';

test('seller and buyer login default to role-aware /dashboard', () => {
  assert.equal(accountLoginDestination(''), '/dashboard');
  assert.equal(accountLoginDestination('?utm_source=email'), '/dashboard');
});
test('legitimate internal returnTo destinations are preserved', () => {
  assert.equal(accountLoginDestination('?returnTo=%2Fmy-product'), '/my-product');
  assert.equal(accountLoginDestination('?returnTo=%2Fedit_product%2F12'), '/edit_product/12');
  assert.equal(accountLoginDestination('?returnTo=%2Fopen-enquiry%2F4%3Ftype%3D1'), '/open-enquiry/4?type=1');
});
test('unsafe or unrecognized destinations fall back to dashboard', () => {
  for (const returnTo of [
    'https://example.com', '//example.com', '/\\example.com', '/admin/dashboard',
    '/products', '/edit_product/0', '/edit_product/1/extra', '/open-enquiry/2?type=2',
    'javascript:alert(1)', '/dashboard?next=https://example.com',
  ]) {
    assert.equal(accountLoginDestination('?returnTo=' + encodeURIComponent(returnTo)), '/dashboard', returnTo);
  }
});

test('public product reviews and company connects return to intended detail page', () => {
  assert.equal(accountLoginDestination('?redirect=%2Fproducts%2Fsteel-pipe'), '/products/steel-pipe');
  assert.equal(accountLoginDestination('?redirect=%2Fcompanies%2Fabc-industries'), '/companies/abc-industries');
});

test('public redirect query cannot navigate to arbitrary or unsafe locations', () => {
  for (const target of [
    'https://evil.example', '//evil.example', '/\\evil.example', '/admin/dashboard',
    '/dashboard', '/products', '/companies', '/products/../../admin',
    '/products/foo?next=/admin', '/products/foo#hash', '/products/%2f%2fevil.example',
    '/companies/a/b', '/products/a%0d%0a', 'javascript:alert(1)',
  ]) {
    assert.equal(accountLoginDestination('?redirect=' + encodeURIComponent(target)), '/dashboard', target);
  }
});

test('returnTo takes priority over redirect and invalid returnTo fails closed', () => {
  assert.equal(accountLoginDestination('?returnTo=%2Fmy-product&redirect=%2Fproducts%2Ffoo'), '/my-product');
  assert.equal(accountLoginDestination('?returnTo=%2Fadmin%2Fdashboard&redirect=%2Fproducts%2Ffoo'), '/dashboard');
});

test('lead-detail returnTo accepts the two application-owned detail modes', () => {
  for (const target of ['/lead-detail/ENQ-123', '/lead-detail/ENQ-123?received=1', '/lead-detail/ENQ-123?my-enquiry=true']) {
    assert.equal(accountLoginDestination('?returnTo=' + encodeURIComponent(target)), target);
  }
});

test('lead-detail returnTo rejects query injection and malformed identifiers', () => {
  for (const target of ['/lead-detail/../admin', '/lead-detail/a/b', '/lead-detail/a?received=0', '/lead-detail/a?received=1&next=evil', '/lead-detail/a#foo', '/lead-detail/a?received=1%0d%0a', '/lead-detail/a?my-enquiry=false']) {
    assert.equal(accountLoginDestination('?returnTo=' + encodeURIComponent(target)), '/dashboard', target);
  }
});

test('account guard keeps detail mode through login redirect', () => {
  assert.equal(accountLoginReturnTarget('/lead-detail/ENQ-123', '?received=1'), '/lead-detail/ENQ-123?received=1');
  assert.equal(accountLoginReturnTarget('/lead-detail/ENQ-123', '?my-enquiry=true'), '/lead-detail/ENQ-123?my-enquiry=true');
  assert.equal(accountLoginReturnTarget('/open-enquiry/8', '?type=1'), '/open-enquiry/8?type=1');
  assert.equal(accountLoginReturnTarget('/profile', '?next=https://evil.example'), '/profile');
  assert.equal(accountLoginReturnTarget('/lead-detail/a', '?received=1&next=https://evil.example'), '/lead-detail/a?received=1');
});
