import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const base='src/app/v2/api/tickets';
const cases=[['route.ts','GET /'],['count/route.ts','GET /count'],['server-side/route.ts','GET /server-side'],['[id]/route.ts','GET /:id'],['[id]/next/route.ts','GET /:ticket_id/next'],['id/[id]/next/route.ts','GET /id/:id/next'],['support-ticket/track/[number]/route.ts','GET /support-ticket/track/:number']];
const original=readFileSync('legacy/sourceindia-express/routes/ticketRoutes.js','utf8');
test('BULK120 original Express ticket GET endpoints correspond to seven dedicated Next handlers',()=>{
 for(const [path] of cases)assert.ok(existsSync(resolve(base,path)),path);
 assert.equal([...original.matchAll(/router\.get\(/g)].length,7);
});
test('No conflicting dynamic route identifiers at /tickets',()=>assert.equal(existsSync(resolve(base,'[ticket_id]')),false));
test('Source explicitly requires admin auth before returning sensitive ticket data',()=>{
 const source=readFileSync('src/lib/localBulk120Tickets.ts','utf8');
 for(const name of ['listTickets','ticketDetail','ticketNext','ticketNextById','ticketGrid'])assert.match(source,new RegExp(`function ${name}\\([^]*?if\\(!auth\\(req\\)\\)return denied\\(\\)`));
 assert.match(source,/timingSafeEqual/);
 assert.match(source,/ticketAdminScope/);
 assert.match(source,/ticketAdminGrid/);
 assert.match(source,/Cache-Control':'private, no-store/);
});
test('All original seven read-only GET handlers remain intact',()=>{
 for(const [file] of cases){const source=readFileSync(resolve(base,file),'utf8');assert.match(source,/export (?:async )?function GET/);}
});
test('BULK120 source and route files parse as TypeScript',()=>{
 for(const name of ['src/lib/localBulk120Tickets.ts',...cases.map(([file])=>`${base}/${file}`)]){
  const result=spawnSync(process.execPath,['--experimental-strip-types','--check',name],{encoding:'utf8'});
  assert.equal(result.status,0,`${name} ${result.stderr}`);
 }
});
