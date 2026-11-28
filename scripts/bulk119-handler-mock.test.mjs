/** Behavior-level tests with in-memory mysql2 API stub; no MySQL or network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const original=readFileSync('src/lib/localBulk119PublicReads.ts','utf8');
const stripped=original.replace(/^import type .*\n/m,'').replace(/^import \{ localAccountDatabase \} from .*\n/m,`const localAccountDatabase=()=>globalThis.__bulk119MockDb;\n`);
const code=stripTypeScriptTypes(stripped,{mode:'transform'});
const api=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function stub(results){
 const calls=[];
 globalThis.__bulk119MockDb={execute:async(sql,args=[])=>{calls.push({sql,args});const row=results.shift();if(!row)throw Error('Unexpected SQL query');return [row,undefined];}};
 return calls;
}
test('FAQ lists include active category name, status and exclude association object',async()=>{
 const calls=stub([[{id:2,uuid:'safe',title:'What?',description:'Answer',category:3,status:1,category_name:'General',is_delete:0,created_at:null,updated_at:null}]]);
 const res=await api.getList('faqs');assert.equal(res.status,200);
 const rows=await res.json();assert.equal(rows.length,1);assert.equal(rows[0].getStatus,'Active');assert.equal(rows[0].category_name,'General');
 assert.ok(!Object.hasOwn(rows[0],'FaqCategory'));assert.match(calls[0].sql,/fc\.status=1/);
});
test('FAQ category count structure is legacy-compatible',async()=>{
 const calls=stub([[{faq:4,faqCategory:3}]]);
 assert.deepEqual(await (await api.getCount('faqs')).json(),{faq:4,faqCategory:3});
 assert.equal(calls.length,1);assert.match(calls[0].sql,/is_delete=0/);
});
test('Testimonial detail includes nested UploadImage and flat file_name',async()=>{
 const calls=stub([[{id:3,name:'Test',joined_file:'upload/a.png',file_id:5,status:1}]]);
 assert.deepEqual(await (await api.getDetail('testimonials','3')).json(),{id:3,name:'Test',file_id:5,status:1,UploadImage:{file:'upload/a.png'},file_name:'upload/a.png'});
 assert.deepEqual(calls[0].args,[3]);
});
test('Malformed identifiers are blocked before the DB is loaded',async()=>{
 let touched=0;globalThis.__bulk119MockDb={execute:async()=>{touched++;return [[],undefined];}};
 for(const bad of ['-1','0','abc','1 OR 1=1','9007199254740993'])assert.equal((await api.getDetail('pages',bad)).status,400);
 assert.equal(touched,0);
});
test('Grid sorting rejects SQL injection and applies bounded LIMIT/OFFSET',async()=>{
 const calls=stub([[{total:10}],[{total:3}], [{id:8,name:'Role',ticket_category:2,category_name:'Support',status:1}]]);
 const req=new Request('http://localhost/v2/api/roles/server-side?sortBy=name%20DESC%3BDROP%20TABLE%20roles&page=2&limit=2&search=help');
 const res=await api.getGrid(req,'roles');assert.equal(res.status,200);
 assert.deepEqual(await res.json(),{data:[{id:8,name:'Role',ticket_category:2,category_name:'Support',status:1}],totalRecords:10,filteredRecords:3});
 assert.match(calls[2].sql,/ORDER BY r\.role_id DESC LIMIT \? OFFSET \?/);
 assert.deepEqual(calls[2].args,['%help%','%help%',2,2]);
});
test('Impossible page sizes are rejected without querying DB',async()=>{
 let touched=0;globalThis.__bulk119MockDb={execute:async()=>{touched++;return[[],undefined];}};
 for(const suffix of ['limit=9999','page=-1','search='+encodeURIComponent('x'.repeat(161))]){
  assert.equal((await api.getGrid(new Request('http://localhost/v2/api/faqs/server-side?'+suffix),'faqs')).status,400);
 }
 assert.equal(touched,0);
});
test('SEO slug lookup is parameterized and unknown slugs return original 404',async()=>{
 const calls=stub([[]]);const res=await api.getSeoBySlug('does-not-exist');
 assert.equal(res.status,404);assert.deepEqual(await res.json(),{message:'Seo Pages not found'});
 assert.match(calls[0].sql,/WHERE s\.slug=\? LIMIT 1/);assert.deepEqual(calls[0].args,['does-not-exist']);
});
