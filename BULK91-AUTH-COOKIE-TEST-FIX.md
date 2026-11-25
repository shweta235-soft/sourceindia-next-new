# Bulk91 authenticated Admin FAQ test-cookie fix

The prior PowerShell script could report login 200 and then 401 for every protected Admin FAQ request. The Admin session cookie is scoped to `/admin`, while the login URL is `/api/admin-session`; the previous test relied entirely on PowerShell's session cookie handling.

This update captures the signed `si_admin_session` value from the login response `Set-Cookie` header and passes it explicitly **only** to `/admin/api/local/faqs...` API requests. It also reports a separate diagnostic if a successful login does not issue the expected cookie. The cookie, password, and FAQ content are never printed. Logout clears the isolated script's cookie and verifies anonymous access still returns 401.

No application endpoint, UI, DB, schema, or dependency changes. No authenticated writes are tested.

## Run

From `E:\nextjs\sourceindia-next-new` with `npm run dev` running, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk91.ps1
```

Expected on a correctly configured local Admin session and database: `BULK91 AUTHENTICATED RESULTS: PASS=7 FAIL=0 TOTAL=7`.

Source-only checks: `node --test scripts/test-local-admin-faq-bulk91.test.mjs` (4/4 PASS here). Live Windows PowerShell and DB HTTP tests must be checked on the user's machine.
