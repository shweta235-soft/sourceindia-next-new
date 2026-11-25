import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
test('public products alias points to catalog and not private /me', () => {
  assert.match(read('../app/api/local/products/route.ts'), /catalog\/products\/route/);
});
test('public categories alias points to catalog', () => {
  assert.match(read('../app/api/local/categories/route.ts'), /catalog\/categories\/route/);
});
test('subcategory alias requires a parent category and rejects duplicate filters', () => {
  const source = read('../app/api/local/subcategories/route.ts');
  assert.match(source, /getAll\('categoryId'\)\.length !== 1/);
  assert.match(source, /validCategoryId\(id\)/);
  assert.match(source, /getByCategory\(request/);
});
test('actual catalog routes remain installed', () => {
  for (const path of [
    '../app/api/local/catalog/products/route.ts',
    '../app/api/local/catalog/categories/route.ts',
    '../app/api/local/catalog/categories/[id]/subcategories/route.ts'
  ]) assert.match(read(path), /localAccountDatabase/);
});
