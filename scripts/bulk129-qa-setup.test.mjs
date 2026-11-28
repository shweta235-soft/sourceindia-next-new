import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');
test('QA setup refuses overwriting existing config and existing DB name',()=>{
 const s=read('scripts/prepare-bulk129-qa.ps1');
 assert.match(s,/Refusing to overwrite it/);
 assert.match(s,/QA DB equals existing/);
 assert.match(s,/New-Object byte\[\] 48/);
 assert.match(s,/RandomNumberGenerator/);
 assert.match(s,/ISOLATED-QA/);
});
test('QA wizard does not mutate database or send mail',()=>{
 const s=read('scripts/prepare-bulk129-qa.ps1');
 assert.doesNotMatch(s,/CREATE DATABASE|INSERT INTO|DELETE FROM|sendMail\(/i);
 assert.match(s,/\.env\.bulk129\.qa\.local/);
});
test('launcher runs read-only preflight and requires explicit approval before Next QA server',()=>{
 const s=read('scripts/start-bulk129-qa.ps1');
 assert.match(s,/check-bulk129-qa-readiness/);
 assert.match(s,/if \(\$LASTEXITCODE -ne 0\)/);
 assert.match(s,/RUN-ISOLATED-QA/);
 assert.match(s,/--hostname 127\.0\.0\.1/);
 assert.match(s,/-PreflightOnly|\[switch\]\$PreflightOnly/);
});
test('QA credentials are ignored by git and stored separate from primary env',()=>{
 assert.match(read('.gitignore'),/\.env\.bulk129\.qa\.local/);
 assert.match(read('scripts/prepare-bulk129-qa.ps1'),/Refusing to overwrite \.env\.local/);
});
