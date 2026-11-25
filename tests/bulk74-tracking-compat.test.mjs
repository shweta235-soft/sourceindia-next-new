import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/app/api/local/subcategories/route.ts', import.meta.url), 'utf8');
test('subcategories tolerates approved UTM tracking while requiring exactly one categoryId', () => {
  assert.match(src, /!isCatalogTrackingParam\(k\)/);
  assert.match(src, /getAll\('categoryId'\)\.length !== 1/);
  assert.match(src, /validCategoryId\(id\)/);
});
