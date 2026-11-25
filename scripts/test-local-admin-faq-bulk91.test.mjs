import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const runner=readFileSync(new URL('./test-local-admin-faq-bulk91.mjs',import.meta.url),'utf8');
const wrapper=readFileSync(new URL('./test-local-admin-faq-bulk91.ps1',import.meta.url),'utf8');
test('uses Node fetch and explicitly sends signed cookie',()=>{assert.match(runner,/\{'Cookie':cookie\}/);assert.match(runner,/redirect:'manual'/);});
test('checks actual /admin/session-status before protected routes',()=>{assert.match(runner,/request\('\/admin\/session-status',\{cookie\}\)/);assert.match(runner,/authenticated !== true/);});
test('never writes FAQ data or prints credentials',()=>{assert.doesNotMatch(runner,/method:'(?:PUT|PATCH|DELETE)'[^\n]*faq/);assert.doesNotMatch(runner,/console\.log[^\n]*(?:password|setCookie|match\[1\])/);});
test('PowerShell wrapper passes secrets via stdin and hides password',()=>{assert.match(wrapper,/Read-Host 'Admin password \(hidden\)' -AsSecureString/);assert.match(wrapper,/RedirectStandardInput\s*=\s*\$true/);assert.match(wrapper,/StandardInput\.Write\(\$payload\)/);assert.match(wrapper,/StandardInputEncoding/);assert.doesNotMatch(wrapper,/Write-Host[^\n]*\$password/);});

test('PowerShell process transports credential JSON without pipeline or argument exposure',()=>{
  assert.doesNotMatch(wrapper,/\$payload\s*\|\s*node/);
  assert.match(wrapper,/ProcessStartInfo/);
  assert.match(wrapper,/Get-Command node/);
  assert.doesNotMatch(wrapper,/Arguments\s*=.*(?:\$email|\$password|\$payload)/);
});
