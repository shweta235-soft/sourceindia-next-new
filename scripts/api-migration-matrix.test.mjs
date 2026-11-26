import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {csvRows} from './api-migration-inventory.mjs';
import {candidateFor,matrixRows} from './api-migration-matrix.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const legacy=csvRows(readFileSync(join(root,'migration/phase57-express-endpoints.csv'),'utf8'));
test('all 516 registration rows retained in the CSV input',()=>{
 assert.equal(legacy.length,516);
 assert.ok(legacy.every(x=>x.method&&x.legacy_path&&x.route_file));
});
test('candidate mapping is module-specific and always unverified',()=>{
 const role=legacy.find(x=>x.route_file==='rolesRoutes.js'&&x.method==='GET'&&x.legacy_path.endsWith('/:id'));
 assert.equal(candidateFor(role),'/admin/api/local/roles/:id');
 assert.equal(candidateFor(legacy.find(x=>x.route_file==='usersRoutes.js'&&x.legacy_path.endsWith('/all'))),'/admin/api/local/users/all');
 const rows=matrixRows(legacy,[{file:'src/app/admin/api/local/roles/[id]/route.ts',methods:['GET'],path:'/admin/api/local/roles/:id'}]);
 assert.equal(rows.length,516);
 assert.ok(rows.every(x=>x.parity_verified===false));
 assert.ok(rows.some(x=>x.mapping_status==='STATIC_ROUTE_SHAPE_CANDIDATE'));
 assert.ok(rows.some(x=>x.mapping_status==='NO_EXPLICIT_ROUTE_MAPPING'));
});
test('complete report and CLI scripts available',()=>{
 const report=JSON.parse(readFileSync(join(root,'migration/reports/bulk104-endpoint-matrix.json'),'utf8'));
 assert.equal(report.stats.legacy_rows,516);
 assert.equal(report.rows.length,516);
 assert.equal(report.stats.parity,'NOT_VERIFIED');
 assert.equal(report.stats.method_path_candidates+report.stats.explicit_module_but_missing_method+report.stats.modules_without_explicit_mapping,516);
});
