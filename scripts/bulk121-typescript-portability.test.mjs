import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

test('BULK121 mock tests resolve TypeScript by package name on Windows, macOS and Linux',()=>{
 const require=createRequire(import.meta.url);
 const ts=require('typescript');
 assert.equal(typeof ts.transpileModule,'function');
 for(const name of ['bulk121-ticket-admin-behavior.test.mjs','bulk121-ticket-write-bridge.test.mjs']){
  const code=readFileSync(new URL('./'+name,import.meta.url),'utf8');
  assert.match(code, /\(['"]typescript['"]\)/, name+' should use TypeScript dependency');
  assert.doesNotMatch(code, /\/opt\/nvm\/|[A-Za-z]:\\.*typescript\/lib/, name+' should not hardcode a TypeScript installation path');
 }
});
