import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCompanyUpdate, ownCompanyUpdateSql } from './localCompanyUpdate.ts';

test('accepts supported trimmed text fields', () => {
  assert.deepEqual(parseCompanyUpdate({designation:' Director ', brief_company:' Hello '}),{designation:'Director',brief_company:'Hello'});
});
test('accepts explicit nulls and empty string clearing', () => {
  assert.deepEqual(parseCompanyUpdate({company_phone:null, company_website:''}),{company_phone:null,company_website:null});
});
test('rejects empty, arrays, unsupported and privileged fields', () => {
  for (const x of [{},[],null,{organization_slug:'hacked'},{organization_name:'Hacked'},{is_verified:1},{company_logo:5},{company_id:99},{remember_token:'abc'},{contact_person:'A', other:'B'}]) assert.equal(parseCompanyUpdate(x),null);
});
test('rejects unsafe website schemes and credentials',()=>{
  for(const u of ['javascript:alert(1)','https://u:p@example.com','ftp://example.com','not-a-url']) assert.equal(parseCompanyUpdate({company_website:u}),null);
});
test('validates email, phone and length',()=>{
  assert.equal(parseCompanyUpdate({company_email:'invalid'}),null);
  assert.equal(parseCompanyUpdate({company_phone:'abc'}),null);
  assert.equal(parseCompanyUpdate({designation:'x'.repeat(256)}),null);
});
test('parameterizes values and uses only allowlisted columns and account ID',()=>{
  const {sql,params}=ownCompanyUpdateSql({designation:'CEO',brief_company:'Test'},42);
  assert.match(sql,/UPDATE company_info AS c INNER JOIN users AS u ON u.company_id = c.company_id/);
  assert.match(sql,/u.user_id = \?/);
  assert.match(sql,/u.status = 1 AND c.is_delete = 0/);
  assert.deepEqual(params,['Test','CEO',42]);
  assert.doesNotMatch(sql,/organization_slug|company_logo|is_verified|remember_token/);
});
test('rejects bad account id or empty changes',()=>{
  assert.throws(()=>ownCompanyUpdateSql({designation:'CEO'},0));
  assert.throws(()=>ownCompanyUpdateSql({},1));
});

test('Phase 72 allows company meta title and product description without privileged fields', () => {
  assert.deepEqual(parseCompanyUpdate({ company_meta_title: '  Supplier profile ', organizations_product_description: '  Industrial parts  ' }), {
    company_meta_title: 'Supplier profile', organizations_product_description: 'Industrial parts'
  });
  assert.equal(parseCompanyUpdate({ company_meta_title: 'a'.repeat(256) }), null);
  assert.equal(parseCompanyUpdate({ organizations_product_description: 'a'.repeat(20001) }), null);
  const {sql,params} = ownCompanyUpdateSql({ company_meta_title: 'Supplier', organizations_product_description: 'Parts' }, 31);
  assert.match(sql, /`company_meta_title` = \?/);
  assert.match(sql, /`organizations_product_description` = \?/);
  assert.deepEqual(params, ['Supplier','Parts',31]);
  assert.match(sql,/u.user_id = \?/);
  assert.doesNotMatch(sql, /organization_slug|company_logo|is_verified/);
});
