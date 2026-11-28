import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const smoke = readFileSync(new URL('./test-local-bulk122.ps1', import.meta.url), 'utf8');
const proxy = readFileSync(new URL('../src/proxy.ts', import.meta.url), 'utf8');
const ticketNative = readFileSync(new URL('../src/lib/localBulk122TicketNative.ts', import.meta.url), 'utf8');

test('BULK122 anonymous smoke expects 401 for admin aliases and 403 for legacy ticket mutations', () => {
  const entries = [...smoke.matchAll(/@\{method='([^']+)';path='([^']+)';status=(\d+)\}/g)]
    .map(([,method,path,status]) => ({method,path,status:Number(status)}));
  assert.equal(entries.length, 13);
  const admin = entries.filter(({path}) => path.startsWith('/admin/api/local/tickets'));
  const legacy = entries.filter(({path}) => path.startsWith('/v2/api/tickets'));
  assert.equal(admin.length, 4);
  assert.equal(legacy.length, 9);
  assert.ok(admin.every(({status}) => status === 401));
  assert.ok(legacy.every(({status}) => status === 403));
  assert.equal(new Set(entries.map(({method,path}) => `${method} ${path}`)).size, 13);
});

test('Proxy denies anonymous admin API access before the ticket QA gate, without changing production write safety', () => {
  assert.match(proxy, /const adminFaqApi = pathname === "\/admin\/api\/local"/);
  assert.match(proxy, /if \(!session && adminFaqApi\)/);
  assert.match(proxy, /status: 401/);
  assert.match(ticketNative, /const denial=ticketQaGate\(\);if\(denial\)return fail\(denial,403\)/);
  assert.match(ticketNative, /if\(env.NODE_ENV==='production'\)return/);
});
