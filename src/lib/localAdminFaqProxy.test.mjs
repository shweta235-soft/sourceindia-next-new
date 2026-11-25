import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8');
test('FAQ API paths are matched exactly and by slash-delimited prefix', () => {
  assert.match(source, /pathname === "\/admin\/api\/local\/faqs"/);
  assert.match(source, /pathname\.startsWith\("\/admin\/api\/local\/faqs\/"\)/);
});
test('anonymous FAQ API receives explicit 401 before admin page redirect', () => {
  const apiBlock = source.indexOf('if (!session && adminFaqApi)');
  const redirectBlock = source.indexOf('if (!session) {', apiBlock);
  assert.ok(apiBlock > 0 && redirectBlock > apiBlock);
  assert.match(source.slice(apiBlock, redirectBlock), /status: 401/);
  assert.match(source.slice(apiBlock, redirectBlock), /Cache-Control/);
});
test('existing admin page login redirect remains intact', () => {
  assert.match(source, /destination\.pathname = "\/admin\/login"/);
  assert.match(source, /NextResponse\.redirect\(destination\)/);
});
