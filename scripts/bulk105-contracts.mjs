/** Source-controlled, read-only authenticated API smoke-test inventory.
 * This file describes expected route shapes, not Express parity.
 */
export const ADMIN_READ_RESOURCES = Object.freeze([
  'faqs', 'front-menu', 'knowledge-center', 'testimonials',
  'ticket-categories', 'interest-categories', 'seo-pages',
  'interest-subcategories', 'shortcut-menus', 'roles', 'activities',
  'core-activities', 'applications', 'membership-plans', 'contacts',
]);
export const ADMIN_COUNT_RESOURCES = Object.freeze(ADMIN_READ_RESOURCES.filter(v => v !== 'faqs'));
export const ADMIN_SERVER_SIDE_RESOURCES = Object.freeze([
  'interest-subcategories', 'shortcut-menus', 'roles', 'activities',
  'core-activities', 'applications', 'membership-plans', 'contacts',
]);
export const ADMIN_SPECIAL_READS = Object.freeze([
  {name:'FAQ categories', path:'/admin/api/local/faqs/categories?page=1&limit=1', field:'items'},
  {name:'Core activity colors', path:'/admin/api/local/core-activities/colors',field:'items'},
  {name:'Activities by core activity', path:'/admin/api/local/activities/coreactivity/1?page=1&limit=1', field:'items'},
  {name:'Sub-interest by category', path:'/admin/api/local/interest-subcategories/category/1?page=1&limit=1', field:'items'},
]);
export function adminReadChecks() {
  const checks=[];
  for(const resource of ADMIN_READ_RESOURCES) {
    checks.push({name:`${resource}:list`,path:`/admin/api/local/${resource}?page=1&limit=1`,field:'items'});
    // A malformed ID must be rejected before querying a database.
    checks.push({name:`${resource}:invalid-ID`,path:`/admin/api/local/${resource}/invalid`,status:400});
  }
  for(const resource of ADMIN_COUNT_RESOURCES)checks.push({name:`${resource}:count`,path:`/admin/api/local/${resource}/count`,field:'total'});
  for(const resource of ADMIN_SERVER_SIDE_RESOURCES)checks.push({name:`${resource}:server-side`,path:`/admin/api/local/${resource}/server-side?page=1&limit=1`,field:'data'});
  checks.push(...ADMIN_SPECIAL_READS);
  return checks;
}
export function validJsonContract(check, payload) {
  if(check.status === 400) return payload !== null && typeof payload === 'object' && !Array.isArray(payload);
  if(!payload || typeof payload !== 'object' || Array.isArray(payload))return false;
  const value = payload[check.field];
  if(check.field==='total')return Number.isSafeInteger(value) && value>=0;
  return Array.isArray(value);
}
