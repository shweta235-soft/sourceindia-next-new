import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function csvRows(input) {
  const out = []; let row = [], cell = '', quoted = false;
  const source = String(input).replace(/^\uFEFF/, '');
  for(let i=0;i<source.length;i++) {
    const c=source[i];
    if (c==='"') { if(quoted && source[i+1]==='"') { cell+='"';i++; } else quoted=!quoted; }
    else if(c===',' && !quoted) {row.push(cell);cell='';}
    else if((c==='\n'||c==='\r') && !quoted) {
      if(c==='\r' && source[i+1]==='\n')i++;
      row.push(cell);if(row.some(x=>x.trim()!==''))out.push(row);row=[];cell='';
    } else cell+=c;
  }
  if (quoted) throw new Error('Unclosed quoted CSV value');
  if(cell!==''||row.length){row.push(cell);out.push(row)}
  const [heads=[],...data] = out;
  return data.map((values,index)=>Object.fromEntries(heads.map((key,i)=>[key,values[i]??''])));
}
export const METHODS=['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'];
export function discoverRouteFiles(dir){
  if(!existsSync(dir))return [];
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?discoverRouteFiles(join(dir,e.name)):e.isFile()&&/^route\.(?:ts|tsx|js|mjs)$/.test(e.name)?[join(dir,e.name)]:[]);
}
export function extractMethodDeclarations(source){
  const methods=[];
  // The scanner intentionally reports possible duplicate declarations but does not parse JavaScript AST.
  const rex=/\bexport\s+(?:(?:async\s+)?function\s+|(?:const|let)\s+)(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
  let match; while((match=rex.exec(source)))methods.push(match[1]);
  return methods;
}
export function fileToRoute(root,file){
  const rel=relative(root,file).split(sep).join('/').replace(/\/route\.(ts|tsx|js|mjs)$/,'');
  return '/'+rel.split('/').filter(x=>!/^\([^/]+\)$/.test(x)).map(x=>x.replace(/^\[\.\.\.(.+)\]$/,':$1*').replace(/^\[(.+)\]$/,':$1')).join('/');
}
export function normalizePath(s){
  const path=String(s||'').split('?')[0].replace(/\/$/,'').replace(/\[[^\]]+\]/g,':param').replace(/:[a-zA-Z_][\w-]*/g,':param');
  return path || '/';
}
export function buildReport(legacy,handlers){
  const duplicates=[];const registered=new Map();
  for(const x of legacy){const key=`${x.method} ${normalizePath(x.legacy_path)}`;const all=registered.get(key)||[];all.push(x);registered.set(key,all);}
  for(const [key,all] of registered)if(all.length>1)duplicates.push({key,count:all.length,sourceFiles:[...new Set(all.map(x=>x.route_file))]});
  const group=new Map();for(const row of legacy){const name=row.route_file||'unknown';if(!group.has(name))group.set(name,{route_file:name,legacy_registrations:0,legacy_methods:{}});const info=group.get(name);info.legacy_registrations++;info.legacy_methods[row.method]=(info.legacy_methods[row.method]||0)+1;}
  const byPath=new Map();for(const h of handlers){for(const method of h.methods){const key=`${method} ${normalizePath(h.path)}`;byPath.set(key,(byPath.get(key)||0)+1)}}
  return {
    generated_at:new Date().toISOString(),
    warning:'This is a static inventory, NOT verified legacy-to-local parity. Some legacy registrations are aliases. A Next.js route may be a proxy, and dynamic paths may represent multiple logical operations.',
    legacy:{registrations:legacy.length,route_files:group.size,methods:Object.fromEntries(METHODS.map(m=>[m,legacy.filter(r=>r.method===m).length])),duplicate_normalized_keys:duplicates},
    next:{route_files:handlers.length,method_exports:handlers.reduce((n,h)=>n+h.methods.length,0),local_route_files:handlers.filter(h=>h.path.startsWith('/api/local/')||h.path.startsWith('/admin/api/local/')).length,local_method_exports:handlers.filter(h=>h.path.startsWith('/api/local/')||h.path.startsWith('/admin/api/local/')).reduce((n,h)=>n+h.methods.length,0),route_declaration_issues:handlers.filter(h=>h.duplicateMethods.length).map(h=>({file:h.file,methods:h.duplicateMethods}))},
    modules:[...group.values()].sort((a,b)=>b.legacy_registrations-a.legacy_registrations||a.route_file.localeCompare(b.route_file)),
    handlers,
    parity:'NOT_VERIFIED',
  };
}
function main(){
 const project=join(dirname(fileURLToPath(import.meta.url)),'..');
 const raw=readFileSync(join(project,'migration','phase57-express-endpoints.csv'),'utf8');
 const legacy=csvRows(raw).map(x=>({method:x.method,legacy_path:x.legacy_path,route_file:x.route_file,auth_hint:x.auth_hint}));
 const appRoot=join(project,'src','app');
 const handlers=discoverRouteFiles(appRoot).map(file=>{
  const source=readFileSync(file,'utf8'),methods=extractMethodDeclarations(source);
  return {path:fileToRoute(appRoot,file),methods,duplicateMethods:[...new Set(methods.filter((m,i)=>methods.indexOf(m)!==i))],file:relative(project,file).split(sep).join('/')};
 }).sort((a,b)=>a.path.localeCompare(b.path));
 const report=buildReport(legacy,handlers);
 const folder=join(project,'migration','reports');mkdirSync(folder,{recursive:true});
 const jsonFile=join(folder,'bulk100-api-inventory.json');
 writeFileSync(jsonFile,JSON.stringify(report,null,2)+'\n');
 const lines=['# Bulk100 — API Migration Inventory','',`Generated: ${report.generated_at}`,'',`**Legacy registrations:** ${report.legacy.registrations} in ${report.legacy.route_files} route files.`,`**Next.js handlers:** ${report.next.route_files} route files, ${report.next.method_exports} HTTP method exports.`,`**Local handlers:** ${report.next.local_route_files} route files, ${report.next.local_method_exports} method exports.`,'',`**Migration parity: ${report.parity}.**`,``,report.warning,'','## Largest legacy modules','', '| Express route source | Registrations |','|---|---:|',...report.modules.slice(0,25).map(m=>`| ${m.route_file.replaceAll('|','\\|')} | ${m.legacy_registrations} |`),'',`## Potential duplicate normalized legacy method/path keys (${report.legacy.duplicate_normalized_keys.length})`,'',...report.legacy.duplicate_normalized_keys.slice(0,25).map(x=>`- ${x.key}: ${x.count} registrations (${x.sourceFiles.join(', ')})`),'',`## Duplicate Next.js method declarations (${report.next.route_declaration_issues.length})`,'',...(report.next.route_declaration_issues.length?report.next.route_declaration_issues.map(x=>`- ${x.file}: ${x.methods.join(', ')}`):['None found by static scanner.']),'','## Next actions','','1. Map each legacy method/path to implementation files and business behavior (not inferred solely from path names).','2. Identify APIs still calling the live backend and write tests for equivalent local responses.','3. Migrate dependent business modules with role/ownership checks and an isolated test database.','4. Mark parity complete only after automated and runtime comparison.',''];
 writeFileSync(join(folder,'bulk100-api-inventory.md'),lines.join('\n'));
 console.log(`Bulk100 inventory OK: legacy=${report.legacy.registrations} local_exports=${report.next.local_method_exports} routes=${report.next.route_files}`);
 console.log('Reports: migration/reports/bulk100-api-inventory.{json,md}');
 if(report.next.route_declaration_issues.length) {console.error('WARN: Duplicate HTTP method exports found');process.exitCode=1;}
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) main();
