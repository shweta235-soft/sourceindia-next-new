import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBuyerMessagePreview,validRecipientCompanyId,buyerRecipientSql} from './localBuyerMessagePreview.ts';
test('valid recipient id',()=>{assert.equal(validRecipientCompanyId('12'),12);assert.equal(validRecipientCompanyId('0'),null);assert.equal(validRecipientCompanyId('abc'),null);});
test('valid body',()=>{assert.deepEqual(parseBuyerMessagePreview({company_id:3,title:' Hi ',message:' Hello '}),{companyId:3,title:'Hi',message:'Hello'});});
test('reject malformed data',()=>{for(const x of [null,{}, {company_id:3,title:'',message:'x'}, {company_id:3,title:'x',message:'y',user_id:44},{company_id:3,title:'x',message:' '.repeat(256)}]) assert.equal(parseBuyerMessagePreview(x),null);});
test('recipient lookup uses parameter binding and active seller filter',()=>{assert.match(buyerRecipientSql,/u\.company_id = \?/);assert.match(buyerRecipientSql,/is_seller = 1/);assert.match(buyerRecipientSql,/is_delete = 0/);});
