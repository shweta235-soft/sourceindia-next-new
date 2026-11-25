import test from 'node:test';
import assert from 'node:assert/strict';
import { ownCompanySql, publicLocalCompanyProfile } from './localCompanyProfile.ts';

test('joins company through current authenticated user ID only', () => {
  assert.match(ownCompanySql, /INNER JOIN company_info AS c ON c.company_id = u.company_id/);
  assert.match(ownCompanySql, /u.user_id = \?/);
  assert.match(ownCompanySql, /u.status = 1/);
  assert.match(ownCompanySql, /u.is_delete = 0/);
  assert.match(ownCompanySql, /c.is_delete = 0/);
});
test('company SQL explicitly selects safe fields and never SELECT star', () => {
  assert.doesNotMatch(ownCompanySql, /SELECT\s+\*/i);
  assert.doesNotMatch(ownCompanySql, /remember_token|callin_pin|email_verified_at|uuid/i);
});
test('profile exposes only allowlisted company fields', () => {
  const data = { id: 4, organization_name: 'Example', organization_slug: 'example', postcode:null,
    brief_company:null, core_activity:null, activity:null, nature_business:null, designation:null,
    company_location:null, contact_person:null, company_phone:null, company_website:null,
    company_email:null, company_logo:null, organization_quality_certification:null,
    is_verified:0, remember_token:'SECRET', callin_pin:1234, uuid:'INTERNAL' };
  const output = publicLocalCompanyProfile(data);
  assert.equal(output.id,4);
  assert.equal(output.organization_name,'Example');
  assert.equal('remember_token' in output,false);
  assert.equal('callin_pin' in output,false);
  assert.equal('uuid' in output,false);
});

test('Phase 72 profile SELECT and response include only approved additional company content', () => {
  assert.match(ownCompanySql, /c.company_meta_title/);
  assert.match(ownCompanySql, /c.organizations_product_description/);
  const result = publicLocalCompanyProfile({ id: 2, company_meta_title: 'Metal supplies', organizations_product_description: 'Parts' });
  assert.equal(result.company_meta_title, 'Metal supplies');
  assert.equal(result.organizations_product_description, 'Parts');
  assert.equal(Object.hasOwn(result,'remember_token'),false);
});
