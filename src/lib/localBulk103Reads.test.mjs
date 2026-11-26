import test from 'node:test';import assert from 'node:assert/strict';
import * as fs from 'node:fs';const {readFileSync}=fs;import {fileURLToPath} from 'node:url';import {join,dirname} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(join(root,p),'utf8');
const names=[
 ['api/local/interest-subcategories/route.ts','interestPublic'],
 ['api/local/interest-subcategories/count/route.ts','interestPublicCount'],
 ['api/local/interest-subcategories/[id]/route.ts','interestPublicDetail'],
 ['api/local/interest-subcategories/category/[id]/route.ts','interestPublicCategory'],
 ['admin/api/local/interest-subcategories/route.ts','interestAdmin'],
 ['admin/api/local/interest-subcategories/count/route.ts','interestAdminCount'],
 ['admin/api/local/interest-subcategories/[id]/route.ts','interestAdminDetail'],
 ['admin/api/local/interest-subcategories/category/[id]/route.ts','interestAdminCategory'],
 ['admin/api/local/shortcut-menus/route.ts','shortcutAdmin'],
 ['admin/api/local/shortcut-menus/count/route.ts','shortcutAdminCount'],
 ['admin/api/local/shortcut-menus/[id]/route.ts','shortcutAdminDetail'] ];
test('all 11 routes single GET and Node.js runtime',()=>{for(const [p,key] of names){const t=read('src/app/'+p);assert.match(t,new RegExp('BULK103_SQL\\.'+key));assert.equal((t.match(/export async function GET/g)||[]).length,1);assert.equal((t.match(/export const runtime/g)||[]).length,1);}});
test('admin reads authenticated and proxy JSON 401',()=>{for(const [p] of names.filter(x=>x[0].startsWith('admin/'))){assert.match(read('src/app/'+p),/authorizedAdminFaq\(req\)/)}const p=read('src/proxy.ts');assert.match(p,/pathname\.startsWith\("\/admin\/api\/local\/"\)/);});
test('public shortcuts absent, avoid leaking admin-only links',()=>{for(const [p] of names){assert.equal(p.startsWith('api/local/shortcut-menus'),false);}});
test('parameterized queries and active-only public interest reads',()=>{const src=read('src/lib/localBulk103Reads.ts');assert.match(src,/s\.status=1 AND c\.status=1/);assert.match(src,/shortcut_menus WHERE is_delete=0/);assert.ok(!src.includes('SELECT *'));});
test('historic root markdown removed, inventories remain',()=>{const {readdirSync,existsSync}=requireFix();for(const p of readdirSync(root)){assert.doesNotMatch(p,/^(BULK|PHASE)\d+.*\.md$/i)}assert.ok(existsSync(join(root,'migration/phase57-express-endpoints.csv')))});
function requireFix(){return {readdirSync:(...args)=>fs.readdirSync(...args),existsSync:(...args)=>fs.existsSync(...args)}}
