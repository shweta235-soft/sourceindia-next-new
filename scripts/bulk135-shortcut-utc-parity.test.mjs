import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const src=readFileSync(resolve('src/lib/localBulk135Shortcuts.ts'),'utf8');
test('shortcut dates use current SQL session-to-UTC offset on both timestamps',()=>{
  assert.match(src,/const utcDate = \(field: 'created_at' \| 'updated_at'\)/);
  assert.match(src,/TIMESTAMPDIFF\(SECOND, NOW\(\), UTC_TIMESTAMP\(\)\)/);
  assert.match(src,/utcDate\('created_at'\)/);
  assert.match(src,/utcDate\('updated_at'\)/);
  assert.doesNotMatch(src,/INTERVAL (?:330 MINUTE|5 HOUR)/);
});
test('shortcut timestamps keep legacy null and JSON ISO format behavior',()=>{
  assert.match(src,/YEAR\(\$\{field\}\)=0/);
  assert.match(src,/MONTH\(\$\{field\}\)=0/);
  assert.match(src,/DAYOFMONTH\(\$\{field\}\)=0/);
  assert.match(src,/DATE_FORMAT\(DATE_ADD/);
  assert.match(src,/AS \$\{field\}/);
});
