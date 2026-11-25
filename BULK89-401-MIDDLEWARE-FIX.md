# Bulk89 – Admin FAQ 401 middleware fix

Root cause: `src/proxy.ts` redirected anonymous requests to `/admin/api/local/faqs...` to the HTML `/admin/login` route. Windows PowerShell followed the redirect, displaying HTTP 200 (login HTML) instead of the intended API HTTP 401.

Fix: anonymous `/admin/api/local/faqs` and `/admin/api/local/faqs/...` now return JSON `401` from the middleware. Existing `/admin` page redirects and signed-cookie checks in each API handler remain unchanged. FAQ status-changing operations remain default-off. No DB schema/data changes.

The updated `scripts/test-local-admin-faqs.ps1` checks JSON content type and disables redirect following. It sends six unauthenticated checks (including rejected PATCH) and does not send valid admin cookies or write data.

Tests: `node --test src/lib/localAdminFaqProxy.test.mjs src/lib/localAdminFaq.test.mjs`; then `npm run build`, `npm run dev`, and in a separate terminal: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faqs.ps1`.
