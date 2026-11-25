import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validCategoryId } from './localCatalog.ts';
const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const catalog = read('./localCatalog.ts');
for (const [key, sql] of [
  ['PUBLIC_CATEGORY_BY_ID', /category_id = \? AND is_delete = 0 AND status = 1 LIMIT 1/],
  ['PUBLIC_SUBCATEGORY_BY_ID', /s\.sub_category_id = \? AND s\.is_delete = 0 AND s\.status = 1/],
  ['PUBLIC_PRODUCT_BY_ID', /p\.product_id = \? AND p\.is_delete = 0 AND p\.status = 1/],
  ['PUBLIC_CATEGORY_COUNT', /COUNT\(\*\) AS total FROM categories/],
  ['PUBLIC_SUBCATEGORY_COUNT', /COUNT\(\*\) AS total FROM sub_categories/],
]) test(key + ' has expected SQL shape', () => {
  assert.ok(catalog.includes(key));
  assert.match(catalog, sql);
});
test('public product-by-id requires approval', () => assert.match(catalog, /AND p\.is_approve = 1 LIMIT 1/));
test('subcategories are scoped to active parent categories', () => {
  assert.match(catalog, /INNER JOIN categories AS c ON c\.category_id = s\.category/);
  assert.match(catalog, /c\.is_delete = 0 AND c\.status = 1/);
});
for (const plural of ['products','categories','subcategories']) {
  test(plural + ' detail route requires numeric ID and account database', () => {
    const s=read('../app/api/local/catalog/'+plural+'/by-id/[id]/route.ts');
    assert.match(s, /validCategoryId\(id\)/);
    assert.match(s, /db\.execute<RowDataPacket\[]>/);
    assert.match(s, /status: 404/);
    assert.match(s, /Cache-Control/);
    assert.match(s, /export const runtime = 'nodejs'/);
  });
  test(plural + ' count route queries MySQL and returns a total', () => {
    const s=read('../app/api/local/catalog/'+plural+'/count/route.ts');
    assert.match(s, /db\.query/);
    assert.match(s, /total: Number/);
    assert.match(s, /Cache-Control/);
  });
}
test('numeric id rejects invalid/overflow/path injection', () => {
  for(const s of ['0', '-1', '1 OR 1=1', '1/2', 'abc', '99999999999999']) assert.equal(validCategoryId(s), null);
  assert.equal(validCategoryId('123'),123);
});
