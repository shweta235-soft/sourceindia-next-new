import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/lib/localBulk128FrontMenu.ts', import.meta.url),'utf8');
test('Front Menu list, grid and detail serialize both timestamp fields as UTC ISO text',()=>{
 assert.match(source,/const sqlUtcDate=/);
 assert.match(source,/DATE_FORMAT\(\$\{field\}/);
 assert.match(source,/const col=`.*sqlUtcDate\('created_at'\).*sqlUtcDate\('updated_at'\)/);
 assert.match(source,/SELECT front_menu_id AS id,parent_id,name,link,is_show,status,type,\$\{sqlUtcDate\('created_at'\)\},\$\{sqlUtcDate\('updated_at'\)\}/);
});
test('Seller and Buyer company search does not force a different order from original un-ordered Sequelize finder',()=>{
 const portion=source.slice(source.indexOf('const [companies]=await pool.execute'),source.indexOf('results=companies.map'));
 assert.match(portion,/LIMIT 3/);
 assert.doesNotMatch(portion,/ORDER BY u\.user_id/);
 assert.match(portion,/u\.company_id/);
});
test('QA write gate remains intact after read-only parity corrections',()=>{
 assert.match(source,/SOURCEINDIA_FRONT_MENU_WRITES_ENABLED/);
 assert.match(source,/NODE_ENV==='production'/);
 assert.match(source,/timingSafeEqual/);
});
