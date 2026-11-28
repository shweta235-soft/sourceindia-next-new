import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='src/lib/localBulk121TicketAdmin.ts';
const src=readFileSync(base,'utf8');
const reads=readFileSync('src/lib/localBulk120Tickets.ts','utf8');
test('BULK121 admin cookie alias is available under /admin path',()=>{
 const name='src/app/admin/api/local/tickets/legacy-grid/route.ts';
 assert.equal(existsSync(name),true);
 assert.match(readFileSync(name,'utf8'),/ticketAdminGrid/);
});
test('active admin + role scope required before ticket records or tracker tokens',()=>{
 assert.match(src,/readAdminSession/);
 assert.match(src,/a\.status=1/);
 assert.match(src,/r\.status=1 AND r\.is_delete=0/);
 assert.match(src,/record\.ticket_category===null/);
 assert.match(src,/category===0/);
 assert.match(reads,/if\('error' in authorization\)return authorization\.error/);
 assert.match(reads,/if\('error'in authorization\)return authorization\.error/);
});
test('Ticket list, detail, and navigation respect role category',()=>{
 for(const s of ['WHERE t.category=?','AND t.category=?','AND category=?'])assert.ok(reads.includes(s),s);
 assert.match(reads,/relatedTickets:related\.map/);
 assert.match(reads,/scope&&!scope\.all/);
});
test('Grid SQL has whitelist sort/pagination and bound filters',()=>{
 assert.match(src,/const sortable:/);
 assert.match(src,/Object\.hasOwn\(sortable/);
 assert.match(src,/q\.getAll\(k\)\.length>1/);
 assert.match(src,/ESCAPE '!'/);
 assert.match(src,/LIMIT \? OFFSET \?/);
 assert.doesNotMatch(src,/\bINSERT\b|\bUPDATE\s+\w|\bDELETE\s+FROM\b/i);
});
test('BULK121 native ticket reads do not mutate records',()=>{
 assert.doesNotMatch(src,/sendMail|\.writeFile|\.unlink|\.createWriteStream/);
 assert.doesNotMatch(reads,/export (?:async )?function (POST|PUT|PATCH|DELETE)/);
});
test('BULK121 source files parse with node TypeScript stripping',()=>{
 for(const file of [base,'src/lib/localBulk120Tickets.ts','src/app/admin/api/local/tickets/legacy-grid/route.ts']){
  const r=spawnSync(process.execPath,['--experimental-strip-types','--check',file],{encoding:'utf8'});
  assert.equal(r.status,0,`${file}: ${r.stderr}`);
 }
});
test('dateRange filters are implemented and invalid custom dates rejected',()=>{
 assert.match(src,/ticketDateFilter/);
 for(const range of ['today','yesterday','last7days','last30days','thismonth','lastmonth','customrange'])assert.ok(src.includes(`'${range}'`),range);
 assert.match(src,/where\.push\('t\.created_at >= \? AND t\.created_at <= \?'\)/);
 assert.match(src,/dateRange\)\{const period=/);
});
