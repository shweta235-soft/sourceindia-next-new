import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('src/app/v2/api/ticket_categories');
const routes=[['route.ts',['GET','POST']],['count/route.ts',['GET']],['server-side/route.ts',['GET']],['[id]/route.ts',['GET','PUT','DELETE']],['[id]/status/route.ts',['PATCH']],['delete-selected/route.ts',['DELETE']]];
test('BULK124: all nine original Express method/path registrations are native',()=>{
 let count=0;
 for(const [p,methods] of routes){assert.ok(existsSync(resolve(root,p)),p);const src=readFileSync(resolve(root,p),'utf8');for(const method of methods){assert.match(src,new RegExp(`export (?:async )?function ${method}\\(`),p+' '+method);count++;}}
 assert.equal(count,9);
});
test('BULK124: original ticket category controller response labels remain preserved',()=>{
 const s=readFileSync('src/lib/localBulk124TicketCategories.ts','utf8');
 for(const x of ['Ticket Category created','Ticket Category updated','Ticket Category deleted successfully','Status updated','Ticket Category not found','totalRecords','filteredRecords','getStatus'])assert.ok(s.includes(x),x);
});
test('BULK124: writes require local explicitly isolated QA DB, secret and non-production',()=>{
 const s=readFileSync('src/lib/localBulk124TicketCategories.ts','utf8');
 for(const x of ["env.NODE_ENV==='production'","SOURCEINDIA_TICKET_CATEGORY_WRITES_ENABLED","SOURCEINDIA_TICKET_CATEGORY_QA_DB_NAME","SOURCEINDIA_TICKET_CATEGORY_QA_TOKEN","timingSafeEqual",'beginTransaction','rollback','FOR UPDATE'])assert.ok(s.includes(x),x);
});
test('BULK124: static server-side and count routes outrank dynamic detail',()=>{
 const src=readFileSync(resolve(root,'[id]/route.ts'),'utf8');assert.ok(src.includes('getCategoryDetail'));
 assert.ok(existsSync(resolve(root,'server-side/route.ts')));
});
test('BULK124: original files remain in legacy snapshot, read-only preserved',()=>{
 assert.ok(existsSync('legacy/sourceindia-express/controllers/ticketCategoryController.js'));
 assert.ok(existsSync('legacy/sourceindia-express/routes/ticketCategoryRoutes.js'));
});
