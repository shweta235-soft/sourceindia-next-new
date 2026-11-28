/**
 * BULK119 — deterministic, GET-only regression for the seven observed
 * Express-vs-Next FAQ/SEO date serialization mismatches.
 * Uses an in-memory mysql2 stub; no database reads or writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source = readFileSync('src/lib/localBulk119PublicReads.ts', 'utf8');
const adapted = source.replace(/^import type .*\n/m, '')
 .replace(/^import \{ localAccountDatabase \} from .*\n/m,
  'const localAccountDatabase=()=>globalThis.__bulk119UtcTestDb;\n');
const js = stripTypeScriptTypes(adapted, {mode:'transform'});
const api = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const iso = '2025-10-12T13:14:15.000Z';
function dbStub(rows) {
 const calls = [];
 globalThis.__bulk119UtcTestDb = {execute: async (sql, args=[]) => {
  calls.push({sql, args});
  if(!rows.length) throw Error('Unexpected query');
  return [rows.shift(), undefined];
 }};
 return calls;
}
const expectSqlUtc = (sql, alias, field) => {
 assert.match(sql, new RegExp(`CASE WHEN ${alias}\\.${field} IS NULL`));
 assert.ok(sql.includes(`DATE_FORMAT(${alias}.${field}, '%Y-%m-%dT%H:%i:%s.%f')`));
 assert.ok(sql.includes(`AS ${field}`));
 assert.match(sql, /CONCAT\(LEFT\(DATE_FORMAT\(/);
};

test('FAQ list: explicitly serializes created_at, retains already matched updated_at', async () => {
 const calls = dbStub([[{id:1, title:'FAQ', status:1, created_at:iso, updated_at:iso, category_name:'General'}]]);
 const res = await api.getList('faqs');
 assert.equal(res.status,200);
 const data = await res.json();
 assert.equal(data[0].created_at,iso);
 assert.equal(data[0].updated_at,iso);
 expectSqlUtc(calls[0].sql,'f','created_at');
 assert.match(calls[0].sql, /,f\.updated_at/);
 assert.doesNotMatch(calls[0].sql, /DATE_FORMAT\(f\.updated_at/);
});

test('FAQ detail: targets only the mismatched created_at field', async () => {
 const calls = dbStub([[{id:1,created_at:iso,updated_at:iso}]]);
 assert.equal((await api.getDetail('faqs','1')).status,200);
 expectSqlUtc(calls[0].sql,'f','created_at');
 assert.doesNotMatch(calls[0].sql,/DATE_FORMAT\(f\.updated_at/);
 assert.deepEqual(calls[0].args,[1]);
});

test('FAQ admin grid: created_at fixed in result SQL, filter/sort SQL unchanged', async () => {
 const calls = dbStub([[{total:3}],[{total:3}],[{id:1,created_at:iso,updated_at:iso}]]);
 const res = await api.getGrid(new Request('http://localhost/v2/api/faqs/server-side?page=1&limit=2'),'faqs');
 assert.equal(res.status,200);
 assert.equal((await res.json()).data[0].created_at,iso);
 expectSqlUtc(calls[2].sql,'f','created_at');
 assert.match(calls[2].sql,/ORDER BY f\.faq_id DESC LIMIT \? OFFSET \?/);
 assert.doesNotMatch(calls[2].sql,/DATE_FORMAT\(f\.updated_at/);
});

test('SEO list: serializes both DATETIME fields to ISO UTC without shifting a wall clock', async () => {
 const calls = dbStub([[{id:16,slug:'enquiry',created_at:iso,updated_at:iso}]]);
 const res = await api.getList('seo_pages');
 assert.equal(res.status,200);
 assert.deepEqual((await res.json())[0],{id:16,slug:'enquiry',created_at:iso,updated_at:iso});
 expectSqlUtc(calls[0].sql,'s','created_at');
 expectSqlUtc(calls[0].sql,'s','updated_at');
 assert.doesNotMatch(calls[0].sql,/TIMESTAMPDIFF|INTERVAL\s+330|CONVERT_TZ/);
});

test('SEO grid, detail and slug use consistent UTC SQL and parameterized lookup',async()=>{
 for(const [fn,expected] of [
  [()=>api.getDetail('seo_pages','16'),[16]],
  [()=>api.getSeoBySlug('enquiry'),['enquiry']],
 ]){
  const calls=dbStub([[{id:16,slug:'enquiry',created_at:iso,updated_at:iso}]]);
  assert.equal((await fn()).status,200);
  expectSqlUtc(calls[0].sql,'s','created_at');
  expectSqlUtc(calls[0].sql,'s','updated_at');
  assert.deepEqual(calls[0].args,expected);
 }
 const calls=dbStub([[{total:3}],[{total:3}],[{id:16,created_at:iso,updated_at:iso}]]);
 const res=await api.getGrid(new Request('http://localhost/v2/api/seo_pages/server-side?page=1&limit=2'),'seo_pages');
 assert.equal(res.status,200);
 const body=await res.json();assert.equal(body.data[0].updated_at,iso);
 expectSqlUtc(calls[2].sql,'s','created_at');
 expectSqlUtc(calls[2].sql,'s','updated_at');
});

test('Unrelated testimonial date columns retain existing mysql2 handling', async()=>{
 const calls=dbStub([[{id:5,name:'Test',created_at:iso,updated_at:iso}]]);
 assert.equal((await api.getList('testimonials')).status,200);
 assert.doesNotMatch(calls[0].sql, /DATE_FORMAT/);
});

test('No writes, schema changes or hardcoded timezone offsets introduced',()=>{
 assert.doesNotMatch(source,/\b(?:INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+\s+SET|DROP\s+TABLE|ALTER\s+TABLE)\b/i);
 assert.doesNotMatch(source,/INTERVAL\s+(?:330|5|30)\b/i);
});
