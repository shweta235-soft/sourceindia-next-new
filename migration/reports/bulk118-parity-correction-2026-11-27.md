# BULK118 Express/Next parity correction — 27 November 2026

## User's observed HTTP result (local DB, before correction)

`MATCH=11 DIFF=7 ERROR=0 TOTAL=18` for the 18 GET-only cases in `scripts/compare-bulk118-express-next.mjs`.

Seven observed differences:
- `/v2/api/activities/server-side?page=1&limit=2`
- `/v2/api/core_activities/server-side?page=1&limit=2`
- `/v2/api/faq_categories/`
- `/v2/api/faq_categories/?all=1`
- `/v2/api/faq_categories/server-side?page=1&limit=2`
- `/v2/api/faqcategories/`
- `/v2/api/faqcategories/server-side?page=1&limit=2`

## Verified source-level mismatches and changes

1. **Grid sorting default.** The three original Express controllers (`activityController.js`, `coreActivityController.js`, `faqCategoryController.js`) use `sort='DESC'` when `sort` is omitted. The earlier native Next.js `parseGridQuery` instead used `ASC` by default. Corrected to default `DESC`. Explicit `sort=ASC` remains supported. Parameter binding, static order allowlist and pagination limits remain unchanged.
2. **Potential FAQ timestamp formatting mismatch.** The original `FaqCategory` Sequelize model uses `timestamps: true`, and the Sequelize MySQL connection defaults to UTC `+00:00`. The new handler used the shared mysql2 pool's platform-local `Date` conversion; this can shift timestamps in the JSON on machines in non-UTC timezones. FAQ list, detail, and FAQ grid select expressions now format `created_at` and `updated_at` as UTC ISO-8601 strings with millisecond precision directly from stored wall-clock DATETIME values. No database update, session timezone changes or global pool changes were made.
3. **Safer diagnostics.** The read-only Express-vs-Next parity script now prints the first mismatched **field paths only**, never actual values or records, allowing safe follow-up if different data or serialization issues remain.

## Verification performed in authoring environment

- BULK114/115/116/118 source tests + new real-handler mock DB tests: 47/47 pass.
- BULK117 legacy compatibility and safety tests: 11/11 pass.
- TypeScript transpilation and mocked SQL behavior check: pass. The mock tests verify generated SQL default DESC, explicit ASC, bound pagination and FAQ UTC formatting expressions.
- Full Next.js build and real Windows MySQL parity check: **NOT run in this environment**. The user's local DB must be used to check outcomes; the prior 7 DIFF cannot be asserted resolved without rerunning the comparator.

## Windows test plan (no writes)

1. Extract the new *full-project ZIP* into `E:\nextjs\sourceindia-next-new`, overwrite project files while preserving `.git`, `.env.local` and `node_modules`.
2. `npm run test:api:bulk118:correction`
3. `npm run build` (stop `npm run dev` first).
4. `npm run dev` in terminal A.
5. `npm run test:api:bulk118:parity` in terminal B; report the final counts and `fields=` for any remaining DIFF. This comparator starts the copied original Express app in-process with an ephemeral loopback port; it performs only GET requests. Ensure legacy dependencies were installed via `npm run setup:legacy:compat` as with BULK117.

This addresses a subset of BULK118 parity; it does **not** assert that all original 516 Express API registrations are native or functionally equivalent. Exact parity for user auth, POST/PUT/PATCH/DELETE writes, mailing and file storage remains unverified.
