/** Exhaustive per-registration migration worklist. Conservative classification only.
 * It NEVER claims functional parity from a path match.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const input=JSON.parse(readFileSync(join(root,process.argv.includes('--bulk111')?'migration/reports/bulk111-endpoint-matrix.json':process.argv.includes('--bulk110')?'migration/reports/bulk110-endpoint-matrix.json':process.argv.includes('--bulk109')?'migration/reports/bulk109-endpoint-matrix.json':'migration/reports/bulk108-endpoint-matrix.json'),'utf8'));
if(input.rows.length!==516||input.rows.some(x=>x.parity_verified!==false))throw new Error('Unexpected source matrix or unsafe parity claim.');
const kind=row=>{
 const path=row.legacy_path.toLowerCase();
 if(/track-open|pixel|mail-history\/track/.test(path))return 'SIDE_EFFECTFUL_GET_TRACKING';
 if(/login|password|token|otp|verify|auth|signup/.test(path))return 'AUTH_CREDENTIALS_OTP';
 if(/resend|send-mail|send-email|mail-send|send-message|bulk-resend/.test(path))return 'OUTBOUND_EMAIL_OR_MESSAGE';
 if(/upload|\/files|\/images|\/file/.test(path))return 'FILE_UPLOAD_STORAGE';
 if(/import|export|download|bulk-/.test(path))return 'BULK_IMPORT_EXPORT';
 if(row.method==='DELETE'||/delete-selected|delete_status/.test(path))return 'DESTRUCTIVE_OR_SOFT_DELETE';
 if(['POST','PUT','PATCH'].includes(row.method))return 'DB_OR_WORKFLOW_WRITE';
 return 'READ_ONLY_CANDIDATE';
};
const rows=input.rows.map(x=>({
 row:x.row,method:x.method,legacy_path:x.legacy_path,original_router:x.legacy_route_file,
 next_route_candidate:x.local_candidate,local_route_file:x.candidate_handler_files,
 shape_match:x.mapping_status==='STATIC_ROUTE_SHAPE_CANDIDATE',risk_group:kind(x),
 implementation_status:'NOT_FULLY_VERIFIED',
 parity_verified:false,
 required_verification:kind(x)==='READ_ONLY_CANDIDATE'?'schema;auth;response-shape;pagination;live-read;error-paths':
 'schema;auth;CSRF;validation;response-shape;isolated side-effect test;rollback/recovery'
}));
const categories={};for(const x of rows)categories[x.risk_group]=(categories[x.risk_group]||0)+1;
const counts={legacy_registrations:rows.length,static_candidates:rows.filter(x=>x.shape_match).length,
 no_static_candidate:rows.filter(x=>!x.shape_match).length,fully_parity_verified:0,
 risk_groups:categories};
const out=join(root,'migration/reports');
writeFileSync(join(out,'full-api-migration-worklist.json'),JSON.stringify({counts,warning:'Static route matching is not full Express-to-Next.js API parity.',rows},null,2)+'\n');
const csv=x=>{const value=String(x??'');return /[",\r\n]/.test(value)?'"'+value.replaceAll('"','""')+'"':value;};
const fields=Object.keys(rows[0]);
writeFileSync(join(out,'full-api-migration-worklist.csv'),[fields.join(','),...rows.map(r=>fields.map(k=>csv(r[k])).join(','))].join('\n')+'\n');
writeFileSync(join(out,'full-api-migration-worklist.md'),[
 '# SourceIndia — Complete API Migration Verification Worklist','',
 `- Original Express registrations: **${counts.legacy_registrations}**`,
 `- Static method/path candidates: **${counts.static_candidates}**`,
 `- Registrations without static matching route: **${counts.no_static_candidate}**`,
 '- Fully verified Express parity by this worklist: **0** (none asserted)','',
 'This worklist contains every original method/path registration. A static match does not prove equivalent auth, response, business workflow or DB effects.','',
 '## Conservative risk classification','', '| Risk group | Count |','|---|---:|',
 ...Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v} |`),
 '', '## Acceptance gates','',
 '- **Read APIs:** run authenticated access, real MySQL schema and response parity tests with representative data, including error/pagination cases',
 '- **Write APIs:** run only on isolated disposable database with external email, uploads and destructive operations disabled or mocked; verify transaction and rollback',
 '- **External effects:** do not mark email delivery, upload, OTP, tracking, payment or physical-delete APIs complete based on mock HTTP tests',
 '- **All 516:** only mark parity after original controller behavior and Next.js implementation are demonstrably equivalent',
 '', 'Full per-route data is in the CSV and JSON files.',''
].join('\n'));
console.log('FULL API WORKLIST:',JSON.stringify(counts));
