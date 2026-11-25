import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const route of ['products', 'categories', 'subcategories']) {
  test(`${route} alias declares local static runtime`, () => {
    const src = readFileSync(new URL(`../src/app/api/local/${route}/route.ts`, import.meta.url), 'utf8');
    assert.match(src, /export const runtime\s*=\s*['"]nodejs['"]/);
    assert.doesNotMatch(src, /export\s*\{[^}]*\bruntime\b[^}]*\}\s*from/);
    assert.match(src, /export async function GET\(/);
  });
}
