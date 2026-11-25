# Bulk89 – Admin FAQ inventory and controlled status APIs

Added 4 admin-scoped routes (`/admin/api/local/faqs`, `/admin/api/local/faqs/[id]`, `/admin/api/local/faqs/categories`, `/admin/api/local/faqs/categories/[id]`) providing 4 GET handlers and 2 PATCH handlers.

Security: signed `si_admin_session` cookie with path `/admin`, cache disabled, no user JWT fallback. PATCH additionally requires same-origin Origin header and is **disabled by default** unless `LOCAL_ADMIN_FAQ_WRITES_ENABLED=true` is explicitly configured. Do not enable in production until auditing admin permissions and checking CSRF/session deployment.

GET listings include inactive/deleted FAQs for legitimate admin inspection; public Bulk88 APIs remain filtered. Category listing includes inactive categories. All SQL uses bound parameters and filters. No database changes or schema migrations. Existing Admin UI still uses its current API; local routes are opt-in.

Test (Node 24): `node --test src/lib/localAdminFaq.test.mjs`; `npm run build`. Node 22 may require `--experimental-strip-types`. Runtime checks require a logged-in Admin session and local MySQL; no write testing recommended.

Remaining: admin create/edit/delete, search/sort/date parity, per-role permissions beyond signed Admin session, UI integration.
