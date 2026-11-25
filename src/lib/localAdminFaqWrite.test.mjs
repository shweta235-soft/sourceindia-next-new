import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFaqWrite,parseCategoryWrite,newFaqUuid,ADMIN_FAQ_INSERT,ADMIN_FAQ_EDIT,ADMIN_FAQ_SOFT_DELETE,ADMIN_FAQ_CATEGORY_INSERT,ADMIN_FAQ_CATEGORY_EDIT} from './localAdminFaqWrite.ts';
test('valid FAQ payload normalized',()=>assert.deepEqual(parseFaqWrite({title:' Example ',description:' Answer ',category:2,status:1}),{title:'Example',description:'Answer',category:2,status:1}));
test('invalid FAQs rejected',()=>{for(const x of [{},{title:'',description:'text',category:2,status:1},{title:'t',description:'',category:2,status:1},{title:'t',description:'text',category:0,status:1},{title:'t',description:'text',category:1,status:'1'},{title:'t',description:'text',category:1,status:1,extra:true},null])assert.equal(parseFaqWrite(x),null);});
test('valid category payload normalized',()=>assert.deepEqual(parseCategoryWrite({name:' Category ',status:0}),{name:'Category',status:0}));
test('invalid category rejected',()=>{for(const x of [{name:'',status:1},{name:'x',status:2},{name:'x',status:1,extra:3},null])assert.equal(parseCategoryWrite(x),null);});
test('UUIDs generated',()=>assert.match(newFaqUuid(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
test('write SQL strictly parameterized, soft delete only',()=>{for(const sql of [ADMIN_FAQ_INSERT,ADMIN_FAQ_EDIT,ADMIN_FAQ_SOFT_DELETE,ADMIN_FAQ_CATEGORY_INSERT,ADMIN_FAQ_CATEGORY_EDIT])assert.match(sql,/\?/);assert.match(ADMIN_FAQ_SOFT_DELETE,/is_delete=1/);assert.doesNotMatch(ADMIN_FAQ_SOFT_DELETE,/^DELETE/i);});
