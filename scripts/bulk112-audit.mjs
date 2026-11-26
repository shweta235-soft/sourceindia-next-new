/** Bulk112: fail-closed audit of the full 516-registration worklist. Read-only. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const matrix=JSON.parse(readFileSync(join(root,'migration/reports/bulk111-endpoint-matrix.json'),'utf8'));
const rows=matrix.rows;
if(rows.length!==516)throw new Error(`Expected 516 legacy registrations, got ${rows.length}`);
const seen=new Set();let unmapped=0;
for(const r of rows){
 if(!r.method||!r.legacy_path||!r.legacy_route_file||!r.mapping_status)throw new Error(`Incomplete row ${r.row}`);
 if(seen.has(r.row))throw new Error(`Duplicate row number ${r.row}`);seen.add(r.row);
 if(r.mapping_status==='NO_EXPLICIT_ROUTE_MAPPING')unmapped++;
 if(r.parity_verified!==false)throw new Error(`Unsubstantiated parity claim row ${r.row}`);
}
console.log(`BULK112 AUDIT PASS: ${rows.length} legacy registrations; ${unmapped} without explicit static mapping; parity NOT_VERIFIED`);
console.log('No API behavior or DB data was modified.');
