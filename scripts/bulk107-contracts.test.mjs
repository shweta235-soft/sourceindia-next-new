import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {BULK107_KINDS,BULK107_CONFIG,bulk107Slug,bulk107Parse} from '../src/lib/localBulk107Contracts.ts';
const root=resolve(import.meta.dirname,'..');
const contractText=readFileSync(resolve(root,'src/lib/localBulk107Contracts.ts'),'utf8');
const handlerText=readFileSync(resolve(root,'src/lib/localBulk107Writes.ts'),'utf8');
const audited=JSON.parse(readFileSync(resolve(root,'src/lib/bulk106-resources.json'),'utf8'));
test('12 independent module schemas, names and edit columns audited against the previous read catalog',()=>{
 assert.equal(BULK107_KINDS.length,12);assert.equal(new Set(BULK107_KINDS).size,12);
 for(const k of BULK107_KINDS){
  assert.match(k,/^[a-z-]+$/);
  const c=BULK107_CONFIG[k];assert.ok(audited[k]);
  assert.ok(c.required.every(x=>Object.hasOwn(c.fields,x)));
  for(const f of Object.keys(c.fields))assert.ok(audited[k].columns.includes(f),k+':'+f);
 }
});
test('all POST and PUT route exports exist with one authenticated dispatcher',()=>{
 for(const k of BULK107_KINDS){
  const route=resolve(root,'src/app/admin/api/local',k,'route.ts');
  const detail=resolve(root,'src/app/admin/api/local',k,'[id]','route.ts');
  assert.ok(existsSync(route)&&existsSync(detail),k);
  assert.match(readFileSync(route,'utf8'),/export async function GET/);
  assert.match(readFileSync(route,'utf8'),/export async function POST/);
  assert.match(readFileSync(detail,'utf8'),/export async function GET/);
  assert.match(readFileSync(detail,'utf8'),/export async function PUT/);
  for(const text of [readFileSync(route,'utf8'),readFileSync(detail,'utf8')]){
   assert.equal((text.match(/export const runtime/g)||[]).length,1);
  }
 }
});
test('only home banners and static pages have soft-delete; all other DELETE unimplemented',()=>{
 const allowed=['home-banners','static-pages'];
 for(const kind of BULK107_KINDS){
  const text=readFileSync(resolve(root,'src/app/admin/api/local',kind,'[id]','route.ts'),'utf8');
  assert.equal(text.includes('export async function DELETE'),allowed.includes(kind),kind);
  assert.equal(BULK107_CONFIG[kind].softDelete,allowed.includes(kind));
 }
 assert.doesNotMatch(handlerText,/DELETE\s+FROM/i);
 assert.match(handlerText,/SET is_delete = 1/);
});
test('strict create requirements, no unknown columns, no raw SQL inputs',()=>{
 const valid=bulk107Parse('product-categories',{name:'  My New Product  ',top_category:1},'create');
 assert.deepEqual(valid,{name:'My New Product',top_category:1,slug:'my-new-product'});
 assert.equal(bulk107Parse('product-categories',{top_category:1},'create'),null);
 assert.equal(bulk107Parse('product-categories',{name:'a',sql:'DROP TABLE'},'create'),null);
 assert.equal(bulk107Parse('product-categories',{name:''},'create'),null);
 assert.equal(bulk107Parse('product-categories',{name:'a',status:'1'},'create'),null);
 assert.equal(bulk107Parse('product-categories',{name:'a',status:2},'create'),null);
 assert.equal(bulk107Parse('item-subcategories',{name:'C',category_id:1,subcategory_id:3},'create'),null);
});
test('invalid identifiers and long/control-containing strings rejected',()=>{
 assert.equal(bulk107Parse('mail-master',{code:'a',list:'b',type:'c',id:1},'create'),null);
 assert.equal(bulk107Parse('home-banners',{file_id:0},'create'),null);
 assert.equal(bulk107Parse('home-banners',{file_id:1,title:'A'.repeat(256)},'create'),null);
 assert.equal(bulk107Parse('home-settings',{page:'foo',section:'foo',meta_key:'key',meta_value:'\u0000'},'create'),null);
 assert.equal(bulk107Parse('nature-businesses',{name:'a\u0001b'},'create'),null);
});
test('safe partial update transforms slug and does not accept is_delete/uuid',()=>{
 assert.deepEqual(bulk107Parse('item-categories',{name:'Nice Part'},'update'),{name:'Nice Part',slug:'nice-part'});
 assert.equal(bulk107Parse('item-categories',{name:'नमस्ते'},'update'),null);
 assert.equal(bulk107Parse('item-categories',{is_delete:1},'update'),null);
 assert.equal(bulk107Parse('item-categories',{uuid:'fake'},'update'),null);
 assert.equal(bulk107Parse('product-keywords',{is_main:1},'update'),null);
 assert.equal(bulk107Slug('  Hello & Good   DAY  '),'hello-good-day');
});
test('gate requires explicit env activation and auth+CSRF checked before DB',()=>{
 const auth=handlerText.indexOf('if(!authorizedAdminFaq(req))');
 const origin=handlerText.indexOf('if(!adminFaqSameOrigin(req))');
 const flag=handlerText.indexOf('if(!bulk107WriteEnabled())');
 const db=handlerText.indexOf('const db=localAccountDatabase()');
 assert.ok(auth>=0&&origin>auth&&flag>origin&&db>flag);
 assert.match(handlerText,/LOCAL_ADMIN_BULK107_WRITES_ENABLED==='true'/);
 assert.match(handlerText,/Object\.values\(body!\)/);
 assert.match(handlerText,/DB/);
});
test('no bulk destructive, upload, email or database schema operations in new dispatcher',()=>{
 assert.doesNotMatch(handlerText,/(?:DROP|TRUNCATE|ALTER|CREATE\s+TABLE|DELETE\s+FROM)\s+/i);
 assert.doesNotMatch(handlerText,/sendMail\(|uploadFile\(/);
 assert.match(handlerText,/ER_DUP_ENTRY/);
});
test('12 modules use no side-effectful newsletter, email template or registration writes',()=>{
 for(const kind of ['newsletter-circulars','email-templates','registrations'])assert.equal(BULK107_KINDS.includes(kind),false);
 assert.match(contractText,/BULK107_CONFIG/);
});
