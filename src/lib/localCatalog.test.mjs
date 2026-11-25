import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const content = readFileSync(new URL('./localCatalog.ts', import.meta.url), 'utf8');
for (const expected of [
  'p.is_delete = 0', 'p.status = 1', 'p.is_approve = 1',
  'category_id AS id', 'sub_category_id AS id', 'category = ?',
  'catalogPage', 'validCatalogSlug', 'validCategoryId',
  'COUNT(*) AS total', 'ORDER BY p.created_at DESC'
]) test(`catalog contract contains ${expected}`, () => assert.ok(content.includes(expected)));
for (const filename of [
  '../app/api/local/catalog/products/route.ts',
  '../app/api/local/catalog/products/[slug]/route.ts',
  '../app/api/local/catalog/categories/route.ts',
  '../app/api/local/catalog/categories/[id]/subcategories/route.ts'
]) test(`catalog endpoint ${filename} uses local database`, () => {
  const code = readFileSync(new URL(filename, import.meta.url), 'utf8');
  assert.match(code, /localAccountDatabase/);
  assert.match(code, /Cache-Control/);
});
