import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const source=readFileSync(join(resolve(import.meta.dirname,'..'),'src/lib/localBulk109Admin.ts'),'utf8');
test('Users summary aggregates on root users table, not four display joins',()=>{
 const summary=source.slice(source.indexOf("if(action==='count'||action==='summary'){"),source.indexOf('  // Users normally need four LEFT JOINs'));
 assert.match(summary,/FROM \$\{bulk109CountPlan\(kind,false\)\}\$\{condition\.baseWhere\}/);
 assert.doesNotMatch(summary,/FROM \$\{s\.from\}\$\{condition\.baseWhere\}/);
 assert.match(source,/users:'users u'/);
 assert.match(summary,/SUM\(\$\{column\}\.\$\{kind==='companies'\?'is_verified':'status'\}=?1\)/);
});
test('Root-only summary is read-only and uses bound base filters',()=>{
 assert.match(source,/FROM \$\{bulk109CountPlan\(kind,false\)\}\$\{condition\.baseWhere\}`,condition\.baseArgs\)/);
 assert.doesNotMatch(source,/\b(?:UPDATE|DELETE FROM|INSERT INTO|TRUNCATE TABLE)\b/i);
});
