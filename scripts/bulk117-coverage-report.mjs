/** Source-level endpoint coverage. The report NEVER asserts functional parity. */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,relative,sep} from 'node:path';
const root=process.cwd();
const apiRoot=join(root,'src/app/v2/api');
function allFiles(p){return readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?allFiles(join(p,e.name)):[join(p,e.name)]);}
const native=allFiles(apiRoot).filter(p=>p.endsWith('/route.ts')||p.endsWith('\\route.ts')).filter(p=>!p.includes('[...legacy]')).map(p=>{
 const src=readFileSync(p,'utf8');const path='/v2/api/'+relative(apiRoot,p).split(sep).slice(0,-1).join('/');
 const re=new RegExp('^'+path.replace(/\[[^\]]+\]/g,'[^/]+').replace(/\/$/,'')+'/?$');
 const methods=['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].filter(m=>new RegExp(`export (?:async )?(?:function|const) ${m}\\b`).test(src));
 return {path,methods,file:relative(root,p).split(sep).join('/'),re};
});
const file=readFileSync(join(root,'migration/phase57-express-endpoints.csv'),'utf8').replace(/\r/g,'').trim().split('\n').slice(1);
const rows=file.map(line=>{const [method,legacy_path,route_file]=line.split(',');
 const match=native.find(n=>n.methods.includes(method)&&n.re.test(legacy_path.replace(/:[^/]+/g,'abc')));
 const isWrite=!['GET','HEAD','OPTIONS'].includes(method);
 const mutatingGet=method==='GET'&&[
  '/v2/api/sellers/sendmail-cron','/v2/api/products/product-keyword-update',
  '/v2/api/users/insert-from-company','/v2/api/signup/insert-from-company'
 ].includes(legacy_path)||method==='GET'&&/^\/v2\/api\/(?:seller_mail_histories\/track-open|tickets\/support-ticket\/track)\//.test(legacy_path);
 return {method,legacy_path,source_router:route_file,
  implementation_mode:match?'NATIVE_NEXT_V2_OVERRIDE':'ORIGINAL_EXPRESS_IN_PROCESS_COMPATIBILITY',
  next_override_file:match?.file??null,
  production_default_enabled:!!match,
  fallback_requires_explicit_write_opt_in:!match&&isWrite,
  fallback_requires_mutating_get_opt_in:!match&&mutatingGet,
  functional_parity_verified:false};
});
if(rows.length!==516)throw Error('Original route count changed: '+rows.length);
const count={original_registrations:rows.length,original_mounts:50,
 original_route_modules:48,native_method_path_overrides:rows.filter(x=>x.next_override_file).length,
 compatibility_fallbacks:rows.filter(x=>!x.next_override_file).length,
 fully_verified_parity:0,
 write_registrations:rows.filter(x=>!['GET','HEAD','OPTIONS'].includes(x.method)).length,
 no_runtime_mysql_comparison:true};
const out=join(root,'migration/reports');
writeFileSync(join(out,'bulk117-compatibility-inventory.json'),JSON.stringify({summary:count,warning:'The Express original handlers are packaged; no native conversion or live 1:1 parity is claimed. Opt-ins restrict activation.',rows},null,2)+'\n');
const summary=`# BULK117 — SourceIndia 516-route original Express compatibility layer\n\n`+
`- **Original registrations:** ${count.original_registrations} across 48 modules and 50 mounts.\n`+
`- **Next-specific v2 method/path overrides:** ${count.native_method_path_overrides}. These take priority over the bridge.\n`+
`- **Original Express bridge fallbacks:** ${count.compatibility_fallbacks}. Original controller/middleware code reused unchanged in-process.\n`+
`- **Fully verified 1:1 Next-native parity:** **0 confirmed in this audit**. This is a compatibility interim solution, NOT a final native migration.\n\n`+
`## Scope and safety\n\n`+
`The original user-uploaded Express JavaScript router/controller/model source was copied into the **Next.js project archive**, while the original React/Express project was not modified. No \`.env\`, static upload data, or original \`server.js\` was included. The original server startup is dangerous because it synchronizes tables and backfills keywords; the bridge does **not** execute it.\n\n`+
`- Development: GET is available through bridge except known side-effectful GETs.\n`+
`- Production: bridge disabled until SOURCEINDIA_LEGACY_COMPAT_PRODUCTION=1.\n`+
`- Writes: disabled until SOURCEINDIA_LEGACY_COMPAT_WRITES=1; do not enable on a shared/production DB.\n`+
`- Side-effectful GETs: disabled until SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET=1.\n`+
`- The old Express controller auth logic is preserved, **not audited**; original unprotected admin queries may expose sensitive data.\n`+
`- Existing Next v2 product/location GET routes still take priority; these are not automatically original-response-identical.\n`+
`- All original source references in this report are from the supplied zip, not Windows drive contents.\n\n`+
`## Install and test on Windows\n\n`+
`Extract the complete project ZIP while preserving your current \`.env.local\`, \`.git\` and \`node_modules\`. Do not copy from the old React directory into it.\n\n`+
`\`\`\`powershell\nnpm run setup:legacy:compat\nnpm run test:api:bulk117\nnpm run build\n\`\`\`\n\n`+
`Start \`npm run dev\` in terminal 1; run in terminal 2:\n\n`+
`\`\`\`powershell\npowershell -ExecutionPolicy Bypass -File .\\scripts\\test-local-bulk117.ps1\n\`\`\`\n\n`+
`API status after these smoke tests **cannot** be called production-ready. Complete 516-controller contract-by-contract tests against an isolated DB and frontend migration remain outstanding.\n`;
writeFileSync(join(out,'bulk117-compatibility-audit.md'),summary);
console.log('BULK117 COVERAGE REPORT:',JSON.stringify(count));
