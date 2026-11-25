import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSellerProductPage, sellerProductListSql, sellerProductCountSql, safeSellerProduct } from './localSellerProducts.ts';

test('default pagination', () => assert.deepEqual(parseSellerProductPage('http://localhost/api/local/products/me'), {page:1,limit:20,offset:0}));
test('custom valid pagination', () => assert.deepEqual(parseSellerProductPage('http://localhost/api/local/products/me?page=3&limit=25'), {page:3,limit:25,offset:50}));
test('rejects query injection or unsupported options', () => {
 for(const q of ['page=-1','page=0','page=1.1','page=1%20OR%201','page=2&page=3','limit=51','limit=0','limit=5%3BDROP','sort=title','page=99999999'])
   assert.equal(parseSellerProductPage('http://localhost/api/local/products/me?'+q),null,q);
});
test('SQL consistently scopes to the logged-in seller and excludes deleted products', () => {
 for(const sql of [sellerProductListSql,sellerProductCountSql]) {
  assert.match(sql,/u\.user_id = \?/); assert.match(sql,/u\.company_id = p\.company_id/);
  assert.match(sql,/u\.is_seller = 1/); assert.match(sql,/p\.is_delete = 0/);
  assert.match(sql,/u\.is_delete = 0/);
 }
});
test('list is stably ordered and paginated', () => {
 assert.match(sellerProductListSql,/ORDER BY p\.created_at DESC, p\.product_id DESC/);
 assert.match(sellerProductListSql,/LIMIT \? OFFSET \?/);
});
test('public mapper never leaks foreign properties', () => {
 const row = {id:8,uuid:'uuid',slug:'item',title:'Item',code:null,article_number:null,short_description:'desc',description:null,quantity:2,category:1,sub_category:null,file_id:null,status:1,is_approve:0,is_featured:null,created_at:'today',updated_at:'today',password:'hidden',user_id:5,company_id:10};
 const result = safeSellerProduct(row);
 assert.equal(result.id,8); assert.equal(result.title,'Item');
 assert.equal('password' in result,false); assert.equal('user_id' in result,false); assert.equal('company_id' in result,false);
});
