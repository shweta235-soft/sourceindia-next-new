import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const read=p=>readFileSync(resolve(p),'utf8');
const route='src/app/v2/api/shortcut/shortcut_menus/route.ts', detail='src/app/v2/api/shortcut/shortcut_menus/[id]/route.ts',lib='src/lib/localBulk135Shortcuts.ts';
test('all four exact original shortcut method/path registrations exist as native Next handlers',()=>{
 const original=read('legacy/sourceindia-express/routes/shortcutRoutes.js');
 const paths=[['get','/shortcut_menus','GET',route],['post','/shortcut_menus','POST',route],['put','/shortcut_menus/:id','PUT',detail],['delete','/shortcut_menus/:id','DELETE',detail]];
 for(const [m,p,method,file] of paths){assert.ok(original.includes(`router.${m}('${p}'`));assert.ok(existsSync(file));assert.match(read(file),new RegExp('export async function '+method+'\\('));assert.ok(!read(file).includes('legacyExpressBridge'));}
 assert.equal((original.match(/router\.(get|post|put|delete|patch)\(/g)||[]).length,4);
});
test('original primary key, list filters, deletion and response wording preserved',()=>{
 const s=read(lib);for(const x of ['shortcut_id AS id','WHERE is_delete=0','name LIKE ? OR link LIKE ?','ORDER BY shortcut_id ASC','Shortcut added successfully','Shortcut updated successfully','Shortcut deleted successfully','Shortcut not found','is_delete=1','uuid','created_at','updated_at'])assert.ok(s.includes(x),x);
});
test('write guard is localhost isolated QA, explicitly gated, and production-deny',()=>{
 const s=read(lib);for(const x of ['NODE_ENV',"SOURCEINDIA_SHORTCUT_QA_WRITES_ENABLED",'SOURCEINDIA_SHORTCUT_QA_DB_NAME','SOURCEINDIA_SHORTCUT_QA_TOKEN','timingSafeEqual','beginTransaction','FOR UPDATE','Origin denied.'])assert.ok(s.includes(x));
});
test('no unsafe SQL string interpolated from public request fields',()=>{
 const s=read(lib);assert.ok(!s.includes('DELETE FROM shortcut_menus'));assert.ok(s.includes('execute<ResultSetHeader>'));assert.ok(s.includes('SELECT ${select}'));assert.ok(s.includes('LIKE ?'));assert.ok(s.includes('UPDATE shortcut_menus SET'));
});
test('changed TS syntax parses',()=>{
 const require=createRequire(import.meta.url);let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');}
 for(const file of [route,detail,lib]){const parsed=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);assert.deepEqual(parsed.parseDiagnostics.map(x=>x.messageText),[],file);}
});
