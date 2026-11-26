/** Bulk104: trace ALL original Express registrations against local route shapes.
 * A candidate path match is not evidence of contract, authorization or DB parity.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {csvRows,discoverRouteFiles,extractMethodDeclarations,fileToRoute,normalizePath} from './api-migration-inventory.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const LEGACY_TO_LOCAL={
 'usersDashboardRoutes.js':['dashboard','/v2/api/dashboard'],
 'activityRoutes.js':['activities','/v2/api/activities'],
 'coreActivityRoutes.js':['core-activities','/v2/api/core_activities'],
 'rolesRoutes.js':['roles','/v2/api/roles'],
 'applicationRoutes.js':['applications','/v2/api/applications'],
 'membershipPlanRoutes.js':['membership-plans','/v2/api/membership_plan'],
 'interestSubCategoriesRoutes.js':['interest-subcategories','/v2/api/interest_sub_categories'],
 'shortcutRoutes.js':['shortcut-menus','/v2/api/shortcut/shortcut_menus'],
 'contactsRoutes.js':['contacts','/v2/api/contacts'],
 // Earlier modules: shape lookup only; no claims about runtime or parity.
 'faqRoutes.js':['faqs','/v2/api/faqs'],
 'faqCategoryRoutes.js':['faqs/categories','/v2/api/faq_categories'],
 'testimonialRoutes.js':['testimonials','/v2/api/testimonials'],
 'seoPagesRoutes.js':['seo-pages','/v2/api/seo_pages'],
 'interestCategoriesRoutes.js':['interest-categories','/v2/api/interest_categories'],
 'ticketCategoryRoutes.js':['ticket-categories','/v2/api/ticket_categories'],
 'knowledgeCenterRoutes.js':['knowledge-center','/v2/api/knowledge_center'],
 'frontMenuRoutes.js':['front-menu','/v2/api/front_menu'],
 // Bulk109: new Admin-only SAFE READS; do not infer legacy authorization/response parity.
 'sellerRoutes.js':['sellers','/v2/api/sellers'],
 'buyerRoutes.js':['buyers','/v2/api/buyers'],
 'usersRoutes.js':['users','/v2/api/users'],
 'companiesRoutes.js':['companies','/v2/api/companies'],
 'enquiriesRoutes.js':['enquiries','/v2/api/enquiries'],
 'ticketRoutes.js':['tickets','/v2/api/tickets'],
 'buyerEnquiryRoutes.js':['buyer-enquiries','/v2/api/buyerenquiry'],
 // Bulk106: NEW local Admin read/status shapes. No automatic Express contract parity.
 'categoriesRoutes.js':['product-categories','/v2/api/categories'],
 'subCategoryRoutes.js':['product-subcategories','/v2/api/sub_categories'],
 'itemCategoryRoutes.js':['item-categories','/v2/api/item_category'],
 'itemSubCategoryRoutes.js':['item-subcategories','/v2/api/item_sub_category'],
 'keywordsRoutes.js':['product-keywords','/v2/api/keywords'],
 'homeBannerRoutes.js':['home-banners','/v2/api/home_banners'],
 'newsletterRoutes.js':['newsletter-circulars','/v2/api/newsletters'],
 'emailsRoutes.js':['email-templates','/v2/api/emails'],
 'registrationsRoutes.js':['registrations','/v2/api/registrations'],
 'pagesRoutes.js':['static-pages','/v2/api/pages'],
 // Consolidated Admin reporting migration (Bulk108); route matching remains static-only.
 'newsletterHistoriesRoutes.js':['newsletter-histories','/v2/api/newsletter_histories'],
 'userActivityRoutes.js':['user-activity','/v2/api/user_activity'],
 'categoryConflictLogsRoutes.js':['category-conflict-logs','/v2/api/category_conflict_logs'],
};
export function candidateFor(row){
 const source=LEGACY_TO_LOCAL[row.route_file];if(!source)return null;
 const [slug,legacyPrefix]=source;
 if(!(row.legacy_path===legacyPrefix||row.legacy_path.startsWith(legacyPrefix+'/')))return null;
 let suffix=row.legacy_path.slice(legacyPrefix.length).replace(/\/$/,'');
 if(slug==='shortcut-menus'&&suffix==='')suffix='';
 if(suffix==='/server-side')suffix='/server-side';
 if(suffix==='/count_relation')suffix='/count-relation';
 if(suffix==='/delete-selected')suffix='/delete-selected';
 if(suffix==='/category_status')suffix='/category-status';
 suffix=suffix.replace(/:([a-zA-Z_][\w-]*)/g,':$1').replace(/delete_status/g,'delete-status').replace(/category_status/g,'category-status');
 return (slug==='dashboard'?'/api/local/':'/admin/api/local/')+slug+suffix;
}
export function matrixRows(legacy,handlers){
 const byRoute=new Map();
 for(const h of handlers)for(const method of h.methods){
  const key=`${method} ${normalizePath(h.path)}`;
  byRoute.set(key,[...(byRoute.get(key)||[]),h.file]);
 }
 return legacy.map((row,index)=>{
  const proposal=candidateFor(row);
  const files=proposal?byRoute.get(`${row.method} ${normalizePath(proposal)}`)||[]:[];
  return {row:index+1,method:row.method,legacy_path:row.legacy_path,legacy_route_file:row.route_file,
    local_candidate:proposal||'',candidate_handler_files:files.join(';'),
    mapping_status:files.length?'STATIC_ROUTE_SHAPE_CANDIDATE':proposal?'NO_MATCHING_LOCAL_METHOD':'NO_EXPLICIT_ROUTE_MAPPING',
    parity_verified:false};
 });
}
function csvCell(s){const v=String(s??'');return /[",\r\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v;}
function main(){
 const src=join(root,'migration','phase57-express-endpoints.csv');
 const legacy=csvRows(readFileSync(src,'utf8'));
 const appRoot=join(root,'src','app');
 const handlers=discoverRouteFiles(appRoot).map(file=>{
  const content=readFileSync(file,'utf8');
  return {path:fileToRoute(appRoot,file),methods:extractMethodDeclarations(content),file:file.slice(root.length+1).replaceAll('\\','/')};
 });
 const rows=matrixRows(legacy,handlers);
 if(rows.length!==legacy.length||rows.some(x=>x.parity_verified!==false))throw new Error('Unsafe mapping result.');
 const stats={legacy_rows:rows.length,method_path_candidates:rows.filter(x=>x.mapping_status==='STATIC_ROUTE_SHAPE_CANDIDATE').length,
  explicit_module_but_missing_method:rows.filter(x=>x.mapping_status==='NO_MATCHING_LOCAL_METHOD').length,
  modules_without_explicit_mapping:rows.filter(x=>x.mapping_status==='NO_EXPLICIT_ROUTE_MAPPING').length,
  parity:'NOT_VERIFIED'};
 const out=join(root,'migration','reports');mkdirSync(out,{recursive:true});
 const batch=process.argv.includes('--bulk111')?'Bulk111':process.argv.includes('--bulk110')?'Bulk110':process.argv.includes('--bulk109')?'Bulk109':process.argv.includes('--bulk108')?'Bulk108':process.argv.includes('--bulk107')?'Bulk107':process.argv.includes('--bulk106')?'Bulk106':'Bulk104';
 const stem=join(out,batch.toLowerCase()+'-endpoint-matrix');
 writeFileSync(stem+'.json',JSON.stringify({generated_at:new Date().toISOString(),stats,rows},null,2)+'\n');
 const headers=Object.keys(rows[0]||{});
 writeFileSync(stem+'.csv',[headers.join(','),...rows.map(x=>headers.map(k=>csvCell(x[k])).join(','))].join('\n')+'\n');
 const unrecognized=rows.filter(x=>x.mapping_status!=='STATIC_ROUTE_SHAPE_CANDIDATE');
 const byModule=new Map();for(const row of rows){
  const old=byModule.get(row.legacy_route_file)||{file:row.legacy_route_file,total:0,shapeCandidates:0};old.total++;
  if(row.mapping_status==='STATIC_ROUTE_SHAPE_CANDIDATE')old.shapeCandidates++;byModule.set(row.legacy_route_file,old);
 }
 writeFileSync(stem+'.md',[
  `# ${batch} — Complete Legacy Endpoint Traceability (STATIC ONLY)`,'',
  `All **${stats.legacy_rows}** legacy registrations have matrix entries.`,
  `**${stats.method_path_candidates}** matching local method/path shape candidates (NOT verified parity).`,
  `**${stats.explicit_module_but_missing_method}** explicit module mappings without matching method/path.`,
  `**${stats.modules_without_explicit_mapping}** entries have no explicit route mapping.`,
  '**0 endpoints are verified for complete Express behavior parity by this inventory.**','',
  'A matching route does not establish equivalent response data, authorization, file handling, emails, pagination or database mutation. All rows in the CSV and JSON retain parity_verified=false.','',
  '## Modules','','| Legacy route file | Registrations | Static method/path candidates |','|---|---:|---:|',
  ...[...byModule.values()].sort((a,b)=>b.total-a.total).map(x=>`| ${x.file} | ${x.total} | ${x.shapeCandidates} |`),
  '',`## First 100 registrations requiring follow-up (${unrecognized.length} total)`,'',
  '| Method | Legacy endpoint | Status |','|---|---|---|',
  ...unrecognized.slice(0,100).map(x=>`| ${x.method} | \`${x.legacy_path}\` | ${x.mapping_status} |`),
  '', 'Use the CSV for **all** entries. Review mappings with original controllers before writing route adapters.',''
 ].join('\n'));
 console.log(`${batch.toUpperCase()} MATRIX: legacy=${stats.legacy_rows} shape_candidates=${stats.method_path_candidates} missing_shapes=${stats.explicit_module_but_missing_method} unmapped=${stats.modules_without_explicit_mapping} parity=${stats.parity}`);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main();
