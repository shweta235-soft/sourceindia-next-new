import assert from 'node:assert/strict';
import test from 'node:test';
import { profileMatchesSession, publicLocalUserProfile } from '../src/lib/localUserProfile.ts';

const profile = {
 id: 42, fname: 'Test', lname: 'User', email: 'test@example.com', is_seller: 1,
 company_id: 9, mobile: '123', alternate_number: null, country_code: '+91',
 country: '101', state: '20', city: '30', address: 'Sample', zipcode: '452001',
 website: null, user_company: 'Acme', password:'sensitive', otp:'123456', real_password:'secret',
 is_admin:1, email_token:'private', remember_token:'private'
};
const claims = {id:42,email:'test@example.com',is_seller:1};
test('current account matches local JWT claims',()=> assert.equal(profileMatchesSession(profile,claims),true));
test('rejects a missing account',()=> assert.equal(profileMatchesSession(null,claims),false));
test('rejects different user id',()=> assert.equal(profileMatchesSession(profile,{...claims,id:43}),false));
test('rejects changed email',()=> assert.equal(profileMatchesSession(profile,{...claims,email:'other@example.com'}),false));
test('rejects changed account role',()=> assert.equal(profileMatchesSession(profile,{...claims,is_seller:0}),false));
test('only explicitly allowed profile keys appear',()=> {
 const result = publicLocalUserProfile(profile);
 assert.deepEqual(Object.keys(result).sort(),[
 'id','fname','lname','email','is_seller','company_id','mobile','alternate_number','country_code','country','state','city','address','zipcode','website','user_company'
 ].sort());
 for(const sensitive of ['password','real_password','otp','email_token','remember_token','is_admin']) assert.equal(sensitive in result,false);
});
test('null optional values are preserved',()=>assert.equal(publicLocalUserProfile(profile).website,null));
