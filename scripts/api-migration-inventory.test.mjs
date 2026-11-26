import test from 'node:test';import assert from 'node:assert/strict';
import {csvRows,extractMethodDeclarations,fileToRoute,normalizePath,buildReport} from './api-migration-inventory.mjs';
test('CSV supports quotes, commas and CRLF',()=>{assert.deepEqual(csvRows('a,b\r\n"x,y",z\r\n'),[{a:'x,y',b:'z'}]);});
test('CSV handles escaped quotes',()=>{assert.deepEqual(csvRows('v\n"a""b"\n'),[{v:'a"b'}]);});
test('duplicate exported method detection source',()=>{assert.deepEqual(extractMethodDeclarations('export async function GET() {}\nexport const POST = async () => {}\nexport async function GET() {}'),['GET','POST','GET']);});
test('fileToRoute drops route groups and converts params',()=>{assert.equal(fileToRoute('/repo/src/app','/repo/src/app/(public)/api/items/[id]/route.ts'),'/api/items/:id');});
test('normalizes matching dynamic route paths',()=>{assert.equal(normalizePath('/v2/api/foo/:id/'),normalizePath('/v2/api/foo/[id]'));});
test('report never asserts parity',()=>{const r=buildReport([{method:'GET',legacy_path:'/v2/api/foo/:id',route_file:'foo.js'},{method:'GET',legacy_path:'/v2/api/foo/[id]',route_file:'foo.js'}],[{path:'/api/local/foo/:id',methods:['GET'],file:'file',duplicateMethods:[]}]);assert.equal(r.parity,'NOT_VERIFIED');assert.equal(r.legacy.duplicate_normalized_keys.length,1);assert.equal(r.next.local_method_exports,1);});
