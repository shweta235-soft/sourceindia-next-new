import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyLocalBuyer} from './bulk111-local-login-diagnostic.mjs';
test('local login diagnosis separates live browser auth and local DB account states without values',()=>{
 assert.equal(classifyLocalBuyer(null,false,false),'LOCAL_ACCOUNT_NOT_FOUND');
 assert.equal(classifyLocalBuyer({status:0,is_delete:0,is_seller:0},false,false),'LOCAL_ACCOUNT_INACTIVE');
 assert.equal(classifyLocalBuyer({status:1,is_delete:1,is_seller:0},false,false),'LOCAL_ACCOUNT_INACTIVE');
 assert.equal(classifyLocalBuyer({status:1,is_delete:0,is_seller:1},false,false),'LOCAL_ACCOUNT_NOT_BUYER');
 assert.equal(classifyLocalBuyer({status:1,is_delete:0,is_seller:0},false,false),'LOCAL_PASSWORD_HASH_UNSUPPORTED');
 assert.equal(classifyLocalBuyer({status:1,is_delete:0,is_seller:0},false,true),'LOCAL_PASSWORD_MISMATCH');
 assert.equal(classifyLocalBuyer({status:1,is_delete:0,is_seller:0},true,true),'LOCAL_ACCOUNT_CREDENTIALS_MATCH_CHECK_SERVER');
});
