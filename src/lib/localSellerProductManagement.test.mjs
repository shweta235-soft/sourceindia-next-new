import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSellerProductUpdate, sellerProductDetailSql, sellerProductSoftDeleteSql, sellerProductUpdateStatement, validSellerProductId } from './localSellerProductManagement.ts';

test('product IDs restricted to positive signed MySQL integers', () => {
  for (const x of ['0', '-1', '1 OR 1=1', '1.1', '2147483648', '']) assert.equal(validSellerProductId(x), null);
  assert.equal(validSellerProductId('123'), 123);
});
test('rejects unknown and approval/ownership fields', () => {
  for (const x of [{}, {status:1}, {is_approve:1}, {company_id:2}, {user_id:3}, {is_delete:1}, [], null]) assert.equal(parseSellerProductUpdate(x), null);
});
test('validates all basic fields, lengths, integers', () => {
  assert.equal(parseSellerProductUpdate({title:'  ' }), null);
  assert.equal(parseSellerProductUpdate({quantity:-1}), null);
  assert.equal(parseSellerProductUpdate({quantity:1.2}), null);
  assert.equal(parseSellerProductUpdate({title:'x'.repeat(256)}), null);
  assert.deepEqual(parseSellerProductUpdate({title:' Test ',quantity:0}), {title:'Test',quantity:0});
});
test('SQL scopes all product reads/writes to authenticated user and linked company', () => {
  for(const sql of [sellerProductDetailSql, sellerProductSoftDeleteSql, sellerProductUpdateStatement({title:'test'}).sql]) {
    assert.match(sql, /u\.user_id = \?/);
    assert.match(sql, /u\.company_id = p\.company_id/);
    assert.match(sql, /p\.is_delete = 0/);
    assert.match(sql, /u\.is_seller = 1/);
  }
});
test('UPDATE uses static columns and placeholders for content', () => {
  const statement=sellerProductUpdateStatement({title:'x\' OR 1=1', quantity:null});
  assert.match(statement.sql, /p\.title = \?/);
  assert.match(statement.sql, /p\.quantity = \?/);
  assert.doesNotMatch(statement.sql,/OR 1=1/);
  assert.deepEqual(statement.values,["x' OR 1=1",null]);
});
test('DELETE is a soft delete',()=>{
  assert.match(sellerProductSoftDeleteSql,/SET p\.is_delete = 1/);
  assert.doesNotMatch(sellerProductSoftDeleteSql,/DELETE FROM/i);
});
