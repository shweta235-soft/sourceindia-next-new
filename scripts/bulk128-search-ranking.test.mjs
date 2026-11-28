import test from 'node:test';
import assert from 'node:assert/strict';
import {weightedFrontMenuKeywords,weightedFrontMenuSearchWords} from '../src/lib/localBulk128Weighted.mjs';
test('native product suggestions copy Express stopwords and leading-prefix ranking',()=>{
  assert.deepEqual(weightedFrontMenuSearchWords('I need Electronic Switch in Indore'),['electronic','switch']);
  const rows=[{id:1,name:'Switch',item_subcategory_id:5},{id:2,name:'Electronic Switch',item_subcategory_id:8},{id:3,name:'Electronic Wire',item_subcategory_id:7}];
  const result=weightedFrontMenuKeywords('electronic switch',rows,6);
  assert.equal(result[0].id,2);
  assert.equal(result[0].full_query_match,true);
  assert.equal(result[0].is_confident_match,true);
});
test('no qualifying search words returns no keyword results',()=>{
  assert.deepEqual(weightedFrontMenuKeywords('the in at',[],6),[]);
  assert.deepEqual(weightedFrontMenuSearchWords('the in at'),[]);
});
test('keyword results are hard limited to six',()=>{
  const rows=Array.from({length:20},(_,i)=>({id:i+1,name:'Electronic Switch '+i,item_subcategory_id:i}));
  assert.ok(weightedFrontMenuKeywords('electronic switch',rows,6).length<=6);
});
