import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync('scripts/test-local-bulk120.ps1','utf8');
test('BULK120 tracking redirect is tested without PowerShell 5.1 Invoke-WebRequest 302 exception',()=>{
 assert.match(script,/Add-Type -AssemblyName System\.Net\.Http/);
 assert.match(script,/AllowAutoRedirect = \$false/);
 assert.match(script,/\$case\.status -eq 302/);
 assert.match(script,/\$redirectClient\.GetAsync\(\$url\)/);
 assert.match(script,/\$redirectClient\.Dispose\(\)/);
 assert.match(script,/support-ticket\/track\/test-bulk120/);
});
