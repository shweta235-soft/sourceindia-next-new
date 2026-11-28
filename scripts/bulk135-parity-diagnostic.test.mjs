import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='scripts/compare-bulk135-express-next.mjs';
test('shortcut parity script parses and diagnoses field-level differences without response-body logs',()=>{
 const source=readFileSync(file,'utf8');
 assert.match(source,/function differences\(/);
 assert.match(source,/function firstDateDelta\(/);
 assert.match(source,/fields=/);
 assert.match(source,/date_delta_minutes=/);
 assert.doesNotMatch(source,/console\.log\([^\n]*(?:JSON\.stringify\(x\)|JSON\.stringify\(y\))/);
 execFileSync(process.execPath,['--check',file]);
});
