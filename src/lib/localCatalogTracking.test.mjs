import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogPage, isCatalogTrackingParam } from './localCatalog.ts';

test('product listing accepts appended utm_source', () => {
  assert.deepEqual(catalogPage('http://localhost:3000/api/local/products?utm_source=chatgpt.com'), { page: 1, limit: 20, offset: 0 });
});
test('product pagination works with UTMs in any order', () => {
  assert.deepEqual(catalogPage('http://localhost:3000/api/local/products?utm_medium=chat&page=2&limit=10&utm_campaign=test'), {page:2,limit:10,offset:10});
});
test('tracking whitelist is narrow', () => {
  for (const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id']) assert.equal(isCatalogTrackingParam(k), true);
  for (const k of ['evil','userId','utm_unsafe','categoryId']) assert.equal(isCatalogTrackingParam(k), false);
});
test('unknown filters and repeated pagination remain rejected', () => {
  assert.equal(catalogPage('http://localhost:3000/api/local/products?page=1&page=2&utm_source=chatgpt.com'), null);
  assert.equal(catalogPage('http://localhost:3000/api/local/products?page=1&unexpected=1'), null);
  assert.equal(catalogPage('http://localhost:3000/api/local/products?limit=51&utm_source=chatgpt.com'), null);
});
