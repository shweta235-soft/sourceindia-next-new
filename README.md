## BULK133 — Front Menu signed INTEGER model parity (2026-11-28)

The original Sequelize FrontMenu model permits signed `INT` values for `parent_id`, `type`, and `position`, whereas BULK132 native inputs rejected negative values. Corrected the validator while preserving strict binary `status`/`is_show` and positive route IDs. **54/54 nested source/mock tests PASS**. Default production write deny remains intact. Real MySQL/SMTP write parity remains unverified; no live mutations were run. See `migration/reports/bulk133-front-menu-signed-integer-parity.md`.

Run `npm run test:api:bulk133` and `npm run build` on the Windows Next.js project.

---

## BULK129 — Contacts & Front Menu QA write contract follow-up (2026-11-28)

Front Menu now preserves Sequelize model defaults (`parent_id`, `position`), supports partial updates, and accepts form-urlencoded numeric fields. Contacts save-before-email correction from previous BULK129 remains intact. **34/34** mocked/source regression tests PASS. New `npm run test:api:bulk129:qa-readiness` validates **read-only** isolated-QA preconditions. **Full live write/SMTP parity is not verified**; never run destructive tests on your working database. See `migration/reports/bulk129-final-write-parity-readiness.md`.

---

## BULK124 (27 Nov 2026) — 9 Ticket Categories native GET/write routes

Native handlers for all nine original method/path registrations. GETs are read-only; writes default-disabled and only gated isolated QA. Source/mock tests 11/11 PASS, prior BULK123 regressions 36/36 PASS. Real MySQL parity and full Windows production build pending. See `migration/reports/bulk124-ticket-categories.md`.

---

## BULK123 (2026-11-27) — QA-only Ticket Attachments & Email Pair Mappings

Added native private ticket attachments (5 MiB bound, extension/MIME/magic validation, secure random file names) for create/store/reply/update/delete and QA-only protected file GET aliases. Restored original Express user/admin email template ID pairs in ticket creation, reply and resolve/cancel status flows; all external deliveries are restricted to explicit QA allowlisted recipients and remain off by default.

**Safety and parity:** No production writes or public file exposure. Live MySQL/SMTP/side-effect parity and full production build remain unverified. See `migration/reports/bulk123-ticket-attachment-mail-audit.md`.

Run `npm run test:api:bulk123`, `npm run test:api:bulk122:db`, `npm run build`; while `npm run dev` is running in another terminal, run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk123.ps1` (15 anonymous default-deny smoke probes, not live writes).

---

# BULK122 Windows TypeScript SMTP sender type fix (27 Nov 2026)

Fixed `TS2322` in `src/lib/localBulk122TicketNative.ts` by using the Nodemailer sender `{name, address}` object required by the project's existing type declaration. QA sender mock assertion added; both Nodemailer declarations now agree. Combined BULK114–122 mock/source tests **122/122 PASS**; targeted strict TS with both declarations PASS. **Full Windows production build retest pending.** No DB records, original Express/React code, or frontend UI changed. Details: `migration/reports/bulk122-windows-smtp-from-type-fix.md`.

---

# BULK121 Windows test-runner compatibility fix (27 Nov 2026)

Fixed two Windows `MODULE_NOT_FOUND` errors in the BULK121 test suite caused by hardcoded Linux TypeScript file paths. Test scripts now resolve the project's declared `typescript` devDependency by package name. BULK121 tests: **22/22 PASS**; combined BULK114–121 source regressions: **101/101 PASS**. The user's Windows MySQL schema preflight (**6/6**) and production build **PASS** were already reported; a new full build was not run here. API behavior, UI and database are untouched. See `migration/reports/bulk121-windows-typescript-test-portability-fix.md`.

---

# BULK121 — Native ticket role scopes + safe mutation method routing (27 Nov 2026)

- BULK120 seven-GET smoke: **PASS=7 FAIL=0**, confirmed by user.
- BULK121 active-admin/role/category checks, `GET /admin/api/local/tickets/legacy-grid`, safe server-side grid, category-scoped ticket reads and previous-ticket navigation.
- Original nine Tickets POST/PUT/PATCH/DELETE method/path exports now registered; all use a **guarded legacy Express bridge**, not native writes. **Writes disabled by default and in production. Do not enable flags on a live DB.**
- BULK121 local source/mock tests: **21/21 PASS**; combined BULK114–121 source/bridge regressions: **94/94 PASS**; targeted strict TS check PASS. Full Next build and live MySQL parity not verified here.
- Instructions and exact route list: `migration/reports/bulk121-ticket-auth-write-guard.md`.

## BULK120 PowerShell 302 redirect smoke-test correction (2026-11-27)

The Windows PowerShell 5.1 `Invoke-WebRequest -MaximumRedirection 0` call could throw `Operation is not valid due to the current state of the object` when testing the legitimate 302 tracker redirect. The tracker test now uses `HttpClient` with `AllowAutoRedirect=false` to observe HTTP 302 directly. Existing API implementation, authentication, database, and UI unchanged. BULK120 source checks: 6/6 PASS; BULK119 regressions: 19/19 PASS. Windows HTTP retest pending. See `migration/reports/bulk120-windows-powershell-302-test-fix.md`.

## BULK119 FAQ/SEO seven-date parity correction (2026-11-27)

Latest Windows parity report: **MATCH=14 DIFF=7 ERROR=0**; all seven differences were `created_at` and/or `updated_at` values on FAQ/SEO endpoints. Targeted UTC ISO SQL serialization now covers the affected fields without touching already-matched API dates. **Combined BULK114–119 source/bridge regression: 79/79 PASS.** Windows MySQL parity retest and full production build are pending. See `migration/reports/bulk119-seven-date-parity-fix.md`.

Validation: `npm run test:api:bulk119`, `npm run build`, then (with `npm run dev` running) `npm run test:api:bulk119:parity`.

## BULK119 — Native FAQ / SEO / Testimonials / Roles / Pages

New 17 GET overrides, 72/72 source+behavior regressions PASS. Full native 516 API parity is **NOT** established. See `migration/reports/bulk119-summary.md` and `bulk119-native-api-manifest.json` for safe local DB/HTTP/Express comparison commands.

---

## BULK118 FAQ updated_at parity diagnostic follow-up (27 Nov 2026)

The user's real MySQL differential test improved to **MATCH=13, DIFF=5, ERROR=0**. Every remaining mismatch was exclusively `updated_at` on FAQ category list and grid aliases. Native FAQ date projection now guards MySQL zero/partial-zero dates as JSON `null` to match the original Sequelize/mysql2 `Invalid Date` JSON behavior, while preserving valid UTC timestamps and all other fields. The read-only parity checker now reports safe metadata (`legacy:null/native:valid-ISO` or date delta) without printing DB values.

This is a **candidate correction** based on the original model/date parser behavior, not a verified live-database pass. On Windows: `npm run build`, restart `npm run dev`, then `npm run test:api:bulk118:parity`. If differences remain, share `fields=` and `updated_at_diagnostic=` (no record data). Existing `.git`, `.env.local`, and `node_modules` must be preserved; original React/Express and MySQL have not been modified.

---

## BULK116 — Legacy /v2/api/products/ HTTP 308 redirect fix (27 Nov 2026)

- Fixes two live HTTP failures (`308` instead of `200`/`400`) at the legacy trailing-slash URL `/v2/api/products/`.
- `next.config.ts` now sets `skipTrailingSlashRedirect: true`; Next.js serves both URL spellings directly. This changes the framework's project-wide trailing-slash redirect behavior, but does not touch frontend pages, data, or API business logic.
- New regression test added, plus two no-slash HTTP checks (now **16** live GET checks).
- Extract full ZIP over target while preserving `.git`, `.env.local`, `node_modules`. **Restart `npm run dev`** so `next.config.ts` reloads.
- Verify with `npm run test:api:bulk116`, the BULK116 PowerShell test script, then stop dev and run `npm run build`. Local MySQL HTTP and production build are not tested in this packaging environment.
- Details: `migration/BULK116-TRAILING-SLASH-HTTP308-FIX.md`.

---

## BULK116 — TypeScript build fix (27 Nov 2026)

- Fixes the `TS2339` product-field access errors on `RowDataPacket` spread results and the `TS2345` suggestions comparator error in `src/lib/localBulk116Products.ts`.
- No endpoint, SQL query, frontend, database schema or data changed.
- Source regression tests run with `npm run test:api:bulk116`; an isolated strict TypeScript check of the repaired module passed with dependency stubs. **A full `npm run build` could not be run in this packaging environment because dependencies were unavailable.**
- Extract over your existing Next.js project, preserving `.git`, `.env.local` and `node_modules`. Run `npm run build` on Windows to confirm the production build, then `npm run dev` plus the HTTP smoke test.
- Detailed scope: `migration/BULK116-TYPESCRIPT-BUILD-FIX.md`.

---

## BULK116 — 8 original-path public Product/Company GET adapters (27 Nov 2026)

- Added eight public **GET-only** routes under `/v2/api/products`: list, all-products, latest-home, suggest, filtered, companies list, company detail, product detail. The original uploaded Express code was inspected **read-only**, without modifying it or the existing Next.js public/Admin UI.
- These are secure bounded, parameterized local read APIs and **are not yet full React/Express 1:1 parity**. Notably original latest-home rotates and updates settings, whereas BULK116 deliberately does not mutate; original suggestions and company filters are more complex. No POST/uploads/email/OTP/DB writes or schema changes.
- Source/SQL validation tests: `npm run test:api:bulk116`. On Windows, after `npm run build` and `npm run dev`, use `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk116.ps1` (14 mock/source + 14 DB table metadata + 14 GET HTTP checks). Live DB and production build **not run in this packaging environment**.
- Full limitations and route table: `migration/BULK116-LEGACY-PUBLIC-PRODUCT-COMPANY-GETS.md`. Existing frontend still points to the configured `NEXT_PUBLIC_API_BASE_URL`; no automatic API switching. Original 516 Express route parity is **NOT complete**.
- Install this full ZIP over Next target **without overwriting** your `.env.local`, `.git`, or local `node_modules`; never change the original `D:\sourceindia` reference.

---

## Bulk115 — 40 Admin-only GET routes + 6 legacy location GET routes

- Full scope and verified limitations: `migration/BULK115-ADMIN-CHARTS-LOCATION-READS.md`.
- Source contracts: `npm run test:api:bulk115`; Windows DB + HTTP smoke: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk115.ps1` (requires `npm run dev` in another terminal).
- New paths and GET-only behavior verified structurally; full Express response parity, live MySQL and production build remain to be verified locally. No React/Express source, database schema or data modified.

---

# Bulk114 — Consolidated Public Catalog Taxonomy APIs (2026-11-26)

**22 new concrete GET-only routes** implemented and source-tested across the five-level SourceIndia catalog taxonomy and product-keyword reference data. The Original Express Sequelize models/controllers were read *without any changes*. This is not a statement that the full 516 Express API registrations are converted or functionally equivalent.

- **Public active-only catalog:** `/api/local/catalog/subcategories`, `/item-categories`, `/item-subcategories`, `/items`, `/product-keywords` with `.count`, `by-id`, and relationship-filtered paths. New taxonomy `/api/local/catalog/taxonomy/{summary,search}` also included.
- Responses: `list -> {data, pagination:{page,limit,total}}`; `count -> {total}`; `by-id -> {data}` or 404; `summary -> {counts}`; `search -> {query,data}`. These are normalized LOCAL contracts, **not** React Express response-parity replacements. Parent category/activity records must also be active and not deleted.
- Safety: all new routes are `GET` only, use fixed SQL table/column allowlists and parameter bindings, no `SELECT *`, no credentials, max 50 rows/page, max 1,000 pages and ten results per resource for search. No changes to existing routes/UI and **no database writes**.
- Source verification (requires Node): `npm run test:api:bulk114` (10 contract checks PASS in the artifact-preparation environment).
- Database schema verification on your local Windows/MySQL: `npm run test:api:bulk114:db` — checks INFORMATION_SCHEMA, no data/changes.
- HTTP after `npm run build` and `npm run dev`: `node scripts/test-local-bulk114-http.mjs` (14 public GET-only checks). Or in a separate PowerShell terminal: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk114.ps1`.
- When installing the full-project ZIP into `E:\nextjs\sourceindia-next-new`, preserve your own `.git`, `.env.local`, and local `node_modules`. If dependencies are missing, run `npm ci` locally. Never copy secrets into a chat.
- **Build status:** Full Next.js production build could not run inside this artifact environment because installed `node_modules` entries are placeholder directories, not actual required modules. You must verify `npm run build` on Windows. **Live MySQL and HTTP checks also remain pending.** Do not enable writes for testing.

Full path inventory and limitations: [`migration/BULK114-PUBLIC-CATALOG-TAXONOMY.md`](migration/BULK114-PUBLIC-CATALOG-TAXONOMY.md).

---

## Bulk111 — Buyer dashboard account-scoped APIs (2026-11-26)

New local Buyer dashboard routes: **6 GET + 2 default-disabled POST** operations (`/api/local/dashboard/...`). Original Express model/controller comparison; per-buyer JWT verification, cross-account guard, bounded read queries, isolated transactional write implementation. Existing UI and the original React project remain unchanged.

- Source + mock tests: `npm run test:api:bulk111`.
- Inventory + full static traceability: `npm run api:inventory` then `npm run api:matrix:bulk111` and `node scripts/full-api-worklist.mjs --bulk111`.
- After `npm run build` and starting `npm run dev`, run **Buyer** live read-only tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk111.ps1`. The script prompts for a local active Buyer account, not Admin credentials. It **does not execute valid database writes**.
- Read [`migration/BULK111-BUYER-DASHBOARD-ACCOUNT-SCOPED.md`](migration/BULK111-BUYER-DASHBOARD-ACCOUNT-SCOPED.md) for behavioral deviations and security gates. **516 API business parity is not complete.**

# SourceIndia Bulk110 — Seller/Buyer Analytics & Reference APIs (2026-11-26)

Bulk109 live signed-Admin **67/67 GET checks PASS** was reported by the user. This full-project ZIP adds **11 original seller/buyer legacy GET endpoints** (no writes) in `src/app/admin/api/local/{sellers,buyers}/...`: seller trends/chart, categories/subcategories, seller messages, designations, nature-businesses, buyer chart and buyer sourcing interests.

These endpoints use **signed Admin sessions**, fixed SQL column allowlists, parameter-bound IDs, time-series ranges capped to safe lengths (default 30 days / 12 months / five years), and no database mutations, email, upload or file deletion. The legacy chart endpoint sometimes queried from the earliest record with an unbounded daily time series; this implementation deliberately bounds dates to prevent timeouts. Exact Express parity for this range behavior is **not** claimed.

After extracting over `E:\nextjs\sourceindia-next-new` while preserving `.env.local`, `.git` and local `node_modules`, run `npm run build`, start `npm run dev`, then in a second PowerShell terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk110.ps1
```

This runs **16 deterministic source/mock checks**, the refreshed 516-registration inventory/matrix, an **9-table read-only INFORMATION_SCHEMA preflight**, then signed Admin **GET-only** live validation. Password is hidden-prompted locally; nothing is logged or uploaded. Some live probes SKIP when no matching category/message records exist. No DB schema changes or writes are made.

The Bulk110 traceability matrix and exhaustive worklist are in `migration/reports/`. Matching method/path shapes **are not proof of business parity**. Original React/Express is reference-only and was not modified. Windows production build and actual MySQL results must be verified locally.

---

## Bulk109 TypeScript build fix (Users page-first listing)

- Fixed the `RowDataPacket[]` vs `{ id: number | string }[]` TypeScript error in `src/lib/localBulk109Admin.ts` by typing the SQL projection containing `u.user_id AS id` as `RowDataPacket & { id: number | string }`.
- Updated the Users page-first regression assertion to enforce that typed SQL result.
- Existing runtime SQL, API responses, authentication, and database schema are unchanged.
- Local source/mock/regression suites pass. Full Next.js production build requires project dependencies and must be checked on your Windows setup.

### Verify

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
# Restart npm run dev in a separate terminal, then:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109-auth.ps1
```

# SourceIndia — Next.js migration

## Bulk109 Users listing timeout follow-up (26 November 2026)

User-reported authenticated verification reached **58/59 PASS**, with `users:list` timing out after 20 seconds while `users:count` returned HTTP 200. The Users default listing now performs **bounded user-ID pagination before the optional company/location joins**, returning the same allowlisted fields and preserving the requested order. Joined text search and company/location sort still use the original SQL path. No database writes or schema changes. Source/mock/regression verification **68/68 PASS**, but the user's real MySQL read and production build are pending. See `migration/BULK109-USERS-LIST-PAGE-FIRST-FIX.md`.

Run `npm run build`, restart `npm run dev`, then run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109-auth.ps1` in a separate terminal. Existing `.env.local` / `.git` should be preserved on extraction.

---


## Bulk109 (26 November 2026): seven Admin read modules, 42 routes, no writes

This complete-project ZIP adds **42 Admin-only GET routes** across Sellers, Buyers, Users, Companies, Enquiries, Tickets, and Buyer Enquiries. Signed Admin authentication, safe field projections (excluding passwords/OTP/tokens), bounded and validated queries, ticket-role category restrictions, per-module count/summary, and ticket detail replies are included. **No new business writes, email sends, uploads or schema changes.** The original React/Express reference remains read-only.

**Run:** `npm run build`, start `npm run dev`, then in a second Windows PowerShell terminal run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109.ps1`. This does a read-only MySQL schema preflight followed by authenticated GET-only checks with hidden credentials. Production build and actual MySQL behavior still need local verification.

Latest static inventory: **516 original Express registrations, 362 local HTTP method exports, 216 method/path matching candidates, 300 unmatched legacy registrations, 0 routes marked fully behaviorally equivalent by tooling**. The 42 new GET exports should not be confused with 42 equivalent original endpoints. **All remaining APIs are NOT yet migrated.** Full scope/limitations: `migration/BULK109-READ-API-STATUS.md`. The complete current 516-route worklist is `migration/reports/full-api-migration-worklist.csv`.

---


## Bulk108 fix (26 November 2026): newsletter history primary key schema mismatch

The user's **read-only MySQL schema preflight** found `news_latter_histories` is missing the Sequelize-model column `newsletter_history_id`. Previous Bulk108 reporting also hardcoded it. This ZIP corrects **both** the preflight and authenticated newsletter-history listing: the app reads `INFORMATION_SCHEMA.COLUMNS` to select an actual single-column numeric primary/unique key or unique `uuid`, and the SQL is built only from a metadata-validated identifier. If no safe unique key exists, the preflight prints the physical column names and continues to report FAIL (no fake success).

No database table, schema or records are modified. The harmless `[MODULE_TYPELESS_PACKAGE_JSON]` warning is unrelated to the failing preflight; no `"type": "module"` migration was applied. Run **`npm run build`**, then (with `npm run dev` running separately) **`powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk108.ps1`**. Six new identity/SQL safety regression tests are included in the combined script. **Live MySQL results still need verification on Windows.**

Cumulative full-project ZIP: **Bulk108 consolidated API checkpoint** (base: Bulk107). Original React/Express code was used for **read-only inspection**; no changes were made to that reference. Existing public/Admin UI and MySQL schema/data are unchanged by this ZIP.

**Important:** Complete Express-to-Next.js API parity is **not verified**. The inventory contains 516 original Express method/path registrations, including aliases. A matching Next.js route is **not** equivalent to verified response, authorization, business logic, uploads, jobs or DB side effects.

## Consolidated API status (Bulk108, 26 November 2026)

**All remaining APIs are NOT yet fully migrated.** Original Express inventory has 516 method/path registrations, while the current project contains **320 local method exports** and **195 static method/path candidates**. These are different measurements. **321 legacy registrations have no static matching route candidate**, and **none of the 516 is asserted fully behaviorally equivalent** by the automated matrix. Do not describe this ZIP as a full 516/516 API migration.

This update adds audited **Admin Email Templates, Newsletter/Registration management and Newsletter History/User Activity/Conflict reporting** routes, strict JSON validation, SQL field allowlists, a **12-table read-only metadata preflight** and a complete **516-registration worklist** at `migration/reports/full-api-migration-worklist.csv`. Hard deletion, multipart upload and email delivery are deliberately **not implemented**. New create/update/clone/status operations are protected by Admin login, same-origin checks and a **default-off** `LOCAL_ADMIN_BULK108_WRITES_ENABLED` flag. Never enable against live or shared data.

**Test on Windows:**

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
npm run dev
# In a new PowerShell terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk108.ps1
```

The combined test performs source/mocked checks, endpoint inventory, **read-only database schema** inspection, then Admin-authenticated GETs and invalid/CSRF-blocked write requests. No valid writes are attempted. Live production build and data-backed API tests must be verified on the user's local Windows/MySQL setup. For full details, see `migration/COMPLETE-API-VERIFICATION-STATUS.md`.

---

## Bulk106 — 15 Admin modules, 70 local HTTP operations

15 modules: `product-categories`, `product-subcategories`, `item-categories`, `item-subcategories`, `product-keywords`, `home-banners`, `home-settings`, `static-pages`, `newsletter-circulars`, `email-templates`, `mail-master`, `registrations`, `designations`, `nature-businesses`, `user-categories`.

Each module has **4 authenticated GETs**: `GET /admin/api/local/{module}`, `/{module}/count`, `/{module}/server-side`, `/{module}/{id}`. The list and server-side endpoints support pagination and validated search/sort. Where the Sequelize model has a relation key, `filterId` is supported. Deleted records (`is_delete=1`) are excluded when the model provides that column.

10 status-bearing models also have `PATCH /admin/api/local/{module}/{id}/status`, accepting JSON `{ "status": 0 }` or `{ "status": 1 }` with a **signed Admin session and same-origin request**. **These writes are DISABLED by default** via `LOCAL_ADMIN_BULK106_WRITES_ENABLED` (must be exactly `true` to enable). Do **not** enable for production data. The supplied tests never send valid same-origin write requests, even if the flag was accidentally enabled. No hard-delete, email, upload or create endpoint is implemented in Bulk106.

The Admin-facing read responses intentionally omit email-template message blobs, newsletter IP/location, and private site settings. Registration records contain personal data and **must never be exposed as public endpoints**. Admin session cookies must remain signed and scoped to `/admin`.

Implementation is based on original model table/column declarations, not exhaustive Express controller behavior. New endpoints are not yet wired into every UI screen. Unsupported legacy operations remain unimplemented.

## Verified locally by ZIP author

- Bulk106 focused source/mock verification: **9/9 PASS**, including an 84-check simulated signed-Admin flow (no actual DB).
- Bulk105 regression: **7/7 PASS**; Bulk104 matrix and foundation regression: PASS.
- Static inventory: **274 local HTTP exports** across **244 Next.js route files**. Legacy matrix: **161 static method/path candidates** (NOT parity).
- TypeScript syntax and ZIP integrity: verified separately.

Bulk105 user-reported local run: **7 source/mock + 19 actual DB metadata + 67 signed Admin API checks PASS** (93 total). These results were for **Bulk105**, not the new Bulk106 APIs. Bulk106 user-reported authenticated safe checks: **84/84 PASS**, combined suite PASS. Bulk106 and Bulk107 production build confirmations are pending unless reported separately.

## Windows installation and verification

1. Extract the full ZIP over `E:\nextjs\sourceindia-next-new`, preserving your existing `.env.local`, `.git`, and `node_modules`. They are not in the ZIP. Do not overwrite local secrets.
2. Run `npm run build` to verify the Next.js 16 production compile.
3. Run `npm run dev` in a dedicated terminal.
4. In a second PowerShell terminal run:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk106.ps1
```

This performs pure source/mock tests, a **read-only INFORMATION_SCHEMA preflight of 15 tables**, and 84 signed-Admin HTTP read/security checks. Admin credentials are entered via hidden prompt and sent only to localhost; no credentials, cookies, response bodies or database records are printed or persisted.

Other useful commands:

```powershell
npm run test:api:bulk106
npm run test:api:bulk105
npm run test:api:foundation
npm run api:inventory
npm run api:matrix:bulk106
npm run build
```

Matrix outputs: `migration/reports/bulk106-endpoint-matrix.{csv,json,md}`. All 516 legacy entries have `parity_verified=false` until the matching controller logic and live behavior are verified.

**Write testing requires explicit approval and a separate disposable database populated with safe fixtures.** No production-state rollback or status update is claimed by the included smoke tests.


## Bulk107: 12 audited Admin management modules (writes default OFF)

Built from original Express Sequelize model definitions, without modifying the original source or database schema. POST/PUT have strict field allowlists for categories, subcategories, item categories, item subcategories, keywords, banners, home settings, pages, mail master, designations, nature-businesses, and user categories. Only banners/pages have soft DELETE; all others deliberately have no DELETE.

`LOCAL_ADMIN_BULK107_WRITES_ENABLED=true` is required to execute any write. **Do not enable this against production or the shared dataset.** Tests below do not mutate any database:

```powershell
npm run test:api:bulk107
npm run test:api:foundation
npm run api:inventory
npm run build
npm run dev
# In another terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk107.ps1
```

This batch tests read-side and anonymous/same-origin/default-OFF guards only; it does **not** establish actual DB write success or full parity with the 516 legacy Express registrations.

Bulk107 endpoint comparison report: `migration/reports/bulk107-endpoint-matrix.md` (method/path candidates only; no parity assertions).

Bulk107 server-side feature flag (default-off): `LOCAL_ADMIN_BULK107_WRITES_ENABLED`. Only enable in a disposable local database after schema and foreign-key verification; this ZIP includes no write-enabled integration tests.


### Bulk109 authenticated-read failure diagnostic patch (26 November 2026)

Live Bulk109 reported `PASS=56 FAIL=3 SKIP=0 TOTAL=59`. Individual failing
endpoint lines were not included in that result, so actual root causes remain
unconfirmed. This full-project package adds protected, development-only
`SAFE DIAG` messages showing the failing endpoint, query stage and sanitized
SQL error code, and prevents NULL ticket-role categories from widening access.
No database records, schema, email, uploads or legacy React files were changed.
Re-run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109.ps1`
and share only the `FAIL` / `SAFE DIAG` lines for exact fixes. The new mock
regression case intentionally simulates three failures; it does not certify
that the user's live three failures have been fixed.

### Bulk109 server-side GET diagnostics follow-up (2026-11-26)

Addresses the ambiguous `HTTP=0` reported by the signed-Admin probe for `sellers:server-side` by preserving received HTTP status and reporting a safe transport/JSON failure reason. Optimizes server-side GET counts with primary-table counts and skips duplicate unfiltered counts. No write operations, uploads, email sends, or schema changes. See `migration/BULK109-SERVER-SIDE-HTTP0-DIAGNOSTIC-FIX.md`. Actual live verification remains pending.

### Bulk109 Users summary timeout fix (2026-11-26)

After the previous fix, the user's live signed-Admin probe reported `PASS=66 FAIL=1 TOTAL=67` with `users:summary` timing out at approximately 20 seconds while `users:count` returned HTTP 200. The summary aggregate now reads solely from the root `users` table rather than joining company and location display tables. Summary counts use the same validated base filter parameters, with no schema or data writes. This addresses one likely cause of the timeout, but must be verified against the user's live MySQL database. Run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109-auth.ps1` with the server restarted, and inspect `users:summary` and final results. See `scripts/bulk109-summary-root-plan.test.mjs` for regression checks. Full TypeScript/build verification is pending on the user's Windows installation.

### Bulk111 browser-vs-local Buyer login diagnostic (26 Nov 2026)

Browser `/login` posts to the configured `NEXT_PUBLIC_API_BASE_URL` endpoint `/signup/login`, but the Bulk111 authenticated read harness deliberately checks the separately implemented local `/api/local/auth/login`. A successful browser session does not prove a local MySQL password hash or local JWT is accepted. On local HTTP 401 the harness now runs a **local-only, read-only** account/role/status/bcrypt comparison and prints a constant `LOCAL BUYER DIAG` code, with no password, hash, email or token disclosure. It does **not** change passwords, bypass authentication, use remote tokens, or modify DB rows. The live GET test continues to fail until the local JWT login itself works.

### BULK115 Windows ZIP extraction fix (November 26, 2026)

The `items/by-category-subcategory-itemcategory-itemsubcategory-all`
endpoint is now implemented with a short physical `[...ids]/route.ts` folder.
Its **public URL does not change**: callers still provide the same four ID
segments. The route enforces exactly four IDs and delegates to the existing
auth-protected GET handler.

This prevents the one deep route file that was missing from the user's
Windows extraction from being silently skipped again. The neighboring
non-`-all` route is unchanged to avoid leaving a conflicting stale copy in
the existing project after ZIP overwrite. No database or original React
files are modified.

Extract the *entire corrected ZIP* over `E:\nextjs\sourceindia-next-new`
with overwrite enabled. Keep `.env.local`, `.git` and `node_modules`.
Run `node --test scripts/bulk115-contracts.test.mjs` and then the existing
`powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk115.ps1`.

## BULK117 original Express API compatibility (NOT full native conversion)

An in-process, loopback-only Express adapter is available for legacy `/v2/api/*`
requests not already owned by a Next.js route. The user-provided Express
controller, router, model and middleware source is copied under
`legacy/sourceindia-express`, excluding the old `server.js`, its `.env` and
uploaded files. The original React project has not been modified.

The source audit reports 516 original method/path registrations: 14 are handled
by existing v2 Next.js route overrides, and the other 502 have an original
Express adapter fallback. These are **not** 502 new native Next.js APIs, and no
claim of full 1:1 runtime parity or production readiness is made.

To install the original dependency lock *within the copied legacy folder*:

```powershell
npm run setup:legacy:compat
npm run test:api:bulk117
```

Then run `npm run build`, start `npm run dev` in one terminal and run the
read-only PowerShell smoke tests in another:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk117.ps1
```

Production fallback API routing is off by default. Write methods and
side-effectful GET requests are blocked by default even in development.
Never turn on write flags against your live/shared MySQL database.

Details and per-route status:
`migration/reports/bulk117-compatibility-audit.md` and
`migration/reports/bulk117-compatibility-inventory.json`.

## BULK118 — native Activities, Core Activities and FAQ Categories GET APIs

BULK118 adds 16 original-method/path GET handlers as **native Next.js APIs**, covering two activity modules and two aliases for FAQ categories. The original Express fallback stays in place for unmigrated routes. Run `npm run test:api:bulk118` and `npm run api:coverage:bulk118` for source and coverage reports, then `npm run build` locally. With `npm run dev` running, use `scripts/test-local-bulk118.ps1` for DB and HTTP smoke, or `npm run test:api:bulk118:parity` to compare 18 native vs original Express GET responses using the **same local MySQL database**. More details: `migration/reports/bulk118-native-read-parity-audit.md`.

**NOT complete:** 30/516 method/path registrations are currently covered by explicit native Next v2 handlers; the other 486 use the original-controller compatibility bridge. Exact production functional parity and safe write/mailer/upload migration are not complete.

## BULK118 parity correction (27 November 2026)

On the user's local MySQL database, the original-vs-native GET comparison reported `MATCH=11 DIFF=7 ERROR=0`. This update corrects the native admin-grid default order (`DESC`, matching original Express controllers) and the FAQ category timestamp serialization (UTC ISO-8601 rather than machine-local mysql2 dates). The parity comparator now reports **differing field paths without exposing database values**.

After extraction (preserve `.env.local`, `.git` and `node_modules`): run `npm run test:api:bulk118:correction`, then `npm run build`, start `npm run dev` in one terminal, and rerun `npm run test:api:bulk118:parity` in another. These changes are read-only. A real database recheck is still required; this ZIP does *not* claim complete Express parity. See `migration/reports/bulk118-parity-correction-2026-11-27.md`.

### BULK118 FAQ timezone parity follow-up (2026-11-27)

A targeted native SQL correction for the remaining five FAQ `updated_at`-only
comparison mismatches (+330 minutes on Windows) is documented in
`migration/BULK118-FAQ-330-MINUTE-TIMEZONE-FIX.md`. No database writes.
Run `npm run test:api:bulk118:correction`, `npm run build`, and the read-only
`npm run test:api:bulk118:parity` against your running local Next.js server.
The new ZIP has **not** been confirmed to reach 18/18 response matches yet.

## BULK122 — Native ticket write handlers (isolated QA, partial parity)

The nine original `ticketRoutes.js` POST/PUT/PATCH/DELETE method/path exports
now invoke `src/lib/localBulk122TicketNative.ts` directly instead of the Express
bridge. The exact method+path contracts are listed in
`migration/reports/bulk122-ticket-native-write-audit.md`.

**Safety:** Writes are *disabled by default* and *always disabled in production*.
They require `SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED=1`, a loopback MySQL host,
`SOURCEINDIA_TICKET_QA_DB_NAME` exactly matching `DB_NAME`, and a database name
including `qa`, `test` or `sandbox`. Never enable against real user data. Ticket
OTP emails require a separate explicit SMTP configuration and recipient allowlist;
no message is sent without it. Tickets and replies use MySQL transactions. Public
replies require the tracker token. Admin writes require an active, category-scoped
admin session. The `/admin/api/local/tickets` write aliases work with the existing
path-scoped admin cookie.

**Not full Express parity:** Multipart attachments (and deletion of an existing
attachment) return `501` until safe authenticated upload serving and lifecycle
handling are verified. User and admin template notifications are not yet fully
migrated. Native tracker tokens are randomized (safer than Express's deterministic
MD5); original response/body edge cases and authenticated write QA remain unverified.
These deliberate divergences are documented; do not treat source/mocked tests as
production business-logic parity.

Commands (work from the full extracted project directory, preserve `.env.local`,
`.git` and `node_modules`):

```powershell
npm run test:api:bulk122
npm run test:api:bulk122:db   # INFORMATION_SCHEMA-only read; safe on your DB
npm run build
npm run dev                 # in terminal 1, with write flag OFF
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk122.ps1  # terminal 2
```

The PowerShell script checks only that unauthorized writes are rejected with
`403`. It never enables writes or tries ticket creation. Do not point it at a
server with QA writes enabled. Authenticated functional testing must use an
isolated cloned QA DB, dedicated QA email inboxes, no production credentials,
and explicit permission to mutate QA records.


## BULK122 Windows anonymous admin 401 smoke correction

For the `/admin/api/local/tickets` aliases, unsigned requests correctly receive HTTP `401` from the admin session proxy. Existing `/v2/api/tickets` mutation routes continue to return HTTP `403` from the disabled QA write gate. Corrected only the smoke script expectations and added source regression tests; **no API guards were relaxed**. Run `npm run test:api:bulk122` and `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk122.ps1` while `npm run dev` is running.

## BULK125 — Knowledge Center native route exports

Added 10 original `knowledgeCenterRoutes.js` method/path signatures under `src/app/v2/api/knowledge_center/`; source test `npm run test:api:bulk125` and read-only comparison `npm run test:api:bulk125:parity` (Next dev server must run). Windows HTTP safety smoke: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk125.ps1`. Read `migration/reports/bulk125-knowledge-center.md` for exact limitations. **Do not enable writes on your original database**. Original controller upload/delete side effects and server-side date-range filters remain incomplete, so the native exports do not establish full 1:1 parity.

## BULK126 — Native Applications routes

12 original Express method/path registrations now have native Next.js route exports at `/v2/api/applications/*`. Safe GET reads and QA-only status/soft-delete operations are implemented. Multipart creation/updates and physical file deletion intentionally remain unavailable (501 after isolated QA authorization), so this is **not full write parity**.

Run `npm run test:api:bulk126`, `npm run test:api:bulk126:db`, and `npm run build`. With `npm run dev` running, use `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk126.ps1` and `npm run test:api:bulk126:parity`. See `migration/reports/bulk126-applications-native-audit.md`.


## BULK126 Applications completion — native multipart and QA file cleanup

- `POST /v2/api/applications/`: native multipart image and transactional application creation.
- `PUT /v2/api/applications/:id`: edit with optional replacement image, safe old-image quarantine and rollback.
- `DELETE /v2/api/applications/:id`: QA-only physical deletion with matching image-record cleanup, rollback restoration.
- PATCH status/category/delete flags and DELETE bulk soft delete remain guarded and mocked.
- See `migration/reports/bulk126-applications-native-audit.md` and `.env.example` for important security limits.
- `npm run test:api:bulk126` runs 20 contract + mocked native behavior tests without touching the database.
- On Windows, `npm run test:api:bulk126:db` reads INFORMATION_SCHEMA only, `npm run build` runs production build, and `scripts/test-local-bulk126.ps1` performs 12 default-deny/GET checks.
- **Production writes stay disabled; no real database destructive/write parity has been established.**


## BULK127 — Contacts native Express-compatible paths (2026-11-27)

Original (read-only reference): `legacy/sourceindia-express/routes/contactsRoutes.js` and `controllers/contactsController.js`.

Seven native method/path exports:

- GET `/v2/api/contacts/` — list all, ascending ID
- GET `/v2/api/contacts/count` — non-deleted count
- GET `/v2/api/contacts/server-side` — filtered, paginated grid
- POST `/v2/api/contacts/` — isolated QA creation + paired template emails (IDs 61,59)
- DELETE `/v2/api/contacts/delete-selected` — isolated QA soft deletion
- DELETE `/v2/api/contacts/:id` — isolated QA physical deletion
- PATCH `/v2/api/contacts/:id/delete_status` — isolated QA status update

**Testing:** `npm run test:api:bulk127`, `npm run test:api:bulk127:db`, `npm run build`. Start `npm run dev`; in a second PowerShell run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk127.ps1` and `npm run test:api:bulk127:parity`.

**Safety:** Writes are disabled in production and by default. Enable only on disposable local QA DB with matching `SOURCEINDIA_CONTACT_QA_DB_NAME`, opt-in `SOURCEINDIA_CONTACT_WRITES_ENABLED=1`, and strong `SOURCEINDIA_CONTACT_QA_TOKEN` (>=32 characters). Email requires additionally `SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED=1`, QA SMTP credentials, a QA admin address, QA from address, and recipient allowlist containing BOTH the admin and the submitting user. Never set these flags against real user data. Source tests never send email or mutate DB. Original Express returns success only after two messages are sent, but original commits a DB row before sending; QA uses a transaction, which is intentionally more conservative and is NOT yet verified as exact side-effect parity. SMTP is inherently non-transactional; use a mail sandbox only.

**Verification scope:** Source and guarded-write checks run in the packaging environment. Full Next.js production build, live GET parity and isolated authorized write/SMTP parity must be verified on Windows. Existing frontend, original React files, DB schema and data were not modified during packaging.


## BULK128 Front Menu
Native front_menu handler exports (GET/list/count/grid/detail; QA-guarded writes). Main-search is still 501 and not Express parity. See migration/BULK128-FRONT-MENU-AUDIT.md.


### BULK129 Contacts + Front Menu write audit
See `migration/reports/bulk129-contacts-front-menu-write-audit.md`. Run `npm run test:api:bulk129`. Production and non-isolated write guards stay enabled.

## BULK134 consolidated Contacts/Front Menu contract corrections
Run `npm run test:api:bulk134`. See `migration/reports/bulk134-consolidated-contacts-front-menu-audit.md` for exact scope, corrections and remaining safety/parity limitations.


## BULK135 Shortcut UTC parity correction (2026-11-28)

The parity diagnostic identified 3 mismatches affecting only `created_at` and `updated_at`, with native-minus-Express offset +330 minutes. Both fields are now serialized using a runtime-derived MySQL session-to-UTC offset in `src/lib/localBulk135Shortcuts.ts`. No fixed timezone constant, API write behavior, database content or original Express code was changed. A new regression test is included in `npm run test:api:bulk135`. **A full Windows production build and real MySQL/Express response parity have not been run in the packaging environment.** Re-run `npm run build`, start `npm run dev`, then run `npm run test:api:bulk135:parity` in a second terminal. Target is `MATCH=4 DIFF=0 ERROR=0`, not yet confirmed.
