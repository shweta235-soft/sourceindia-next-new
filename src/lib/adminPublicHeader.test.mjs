import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const endpoint = file('../app/admin/session-status/route.ts');
const proxy = file('../proxy.ts');
const header = file('../components/layout/FrontHeader.tsx');
const adminRoute = file('../app/api/admin-session/route.ts');
test('Status API verifies the existing signed admin session instead of accepting client claims',()=>{
 assert.match(endpoint,/readAdminSession\(request\.cookies\.get\(adminSessionCookie\)/);
 assert.match(endpoint,/authenticated/);
 assert.match(endpoint,/no-store/);
 assert.doesNotMatch(endpoint,/token:|secret:|session\.id/);
});
test('Status endpoint is allowed through admin proxy without weakening other admin paths',()=>{
 assert.match(proxy,/pathname === "\/admin\/session-status"/);
 assert.match(proxy,/if \(!session\)/);
});
test('Cookie path and Admin login/logout remain unchanged',()=>{
 assert.match(adminRoute,/path: "\/admin"/);
 assert.match(adminRoute,/export async function DELETE/);
});
test('Public header verifies Admin status on navigation and retains Buyer/Seller preference',()=>{
 assert.match(header,/fetch\("\/admin\/session-status"/);
 assert.match(header,/\[pathname,showLoggedIn\]/);
 assert.match(header,/showLoggedIn\?</);
 assert.match(header,/adminAuthenticated\?</);
 assert.match(header,/href="\/admin\/dashboard"/);
 assert.match(header,/logoutAdmin/);
});
