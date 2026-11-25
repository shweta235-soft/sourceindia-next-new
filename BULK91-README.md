# SourceIndia Bulk91 – Authenticated Admin FAQ Read-only Verification

Built on Bulk90. No source API behavior, UI, package dependencies, or schema changed.

## New files
- `scripts/test-local-admin-faq-bulk91.ps1`: authenticated smoke test using existing `/api/admin-session`, automatically manages `si_admin_session` cookie in an isolated PowerShell `WebRequestSession` and logs out afterward.

## What it tests
1. Existing Admin login returns HTTP 200 JSON.
2. `GET /admin/api/local/faqs` returns HTTP 200 JSON.
3. `GET /admin/api/local/faqs/categories` returns HTTP 200 JSON.
4. Malformed FAQ ID returns HTTP 400 JSON.
5. Malformed FAQ category ID returns HTTP 400 JSON.
6. Test-session logout succeeds.
7. Post-logout FAQ list access returns HTTP 401 JSON.

No create/edit/delete APIs are invoked. No session secrets, cookies or private FAQ responses are printed. Admin credentials are prompted using secure PowerShell input. The test requires the real Admin credentials (NOT local Seller/Buyer credentials); Admin authentication still uses the upstream admin login API.

## Run on Windows
```
cd E:\nextjs\sourceindia-next-new
npm run build
npm run dev
```
In a second terminal:
```
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk91.ps1
```
Expected `BULK91 AUTHENTICATED RESULTS: PASS=7 FAIL=0 TOTAL=7` if Admin login and DB are working.

## GitHub publication
GitHub push has not been performed by the assistant. After applying and testing the ZIP, run `git status`, inspect the branch, commit the intended changes, then push the correct branch. Never commit `.env.local`, `node_modules`, `.next`, or local test credentials.
