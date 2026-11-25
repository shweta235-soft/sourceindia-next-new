import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { companyListingConnectHref } from '../src/lib/companyListingConnect.ts';

test('buyer company listing navigates to selected detail rather than generic login', () => {
  const source = readFileSync(new URL('../src/components/public/CompanyListingFilter.tsx', import.meta.url), 'utf8');
  assert.match(source, /mode==="buyer"\?\(url\?<Link href=\{url\}/);
  assert.doesNotMatch(source, /mode==="buyer"\?<Link href="\/login"/);
});

test('valid company slugs resolve to route-specific Connect destination', () => {
  for (const slug of ['abc-industries', 'ACME_123', 'seller123']) {
    assert.equal(companyListingConnectHref(slug), `/companies/${slug}`);
  }
});

test('missing or dangerous company slugs cannot become navigation targets', () => {
  for (const slug of [undefined, null, '', '../admin', '//evil.example', 'a/b', 'space here', 'foo?next=/admin', 'a#b', 'x%2Fy', 'x\\y']) {
    assert.equal(companyListingConnectHref(slug), null);
  }
});
