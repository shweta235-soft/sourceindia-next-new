# BULK119 — Seven FAQ/SEO date parity differences: targeted correction

## Starting evidence (Windows Express-vs-Next MySQL differential test, 2026-11-27)

- MATCH 14, DIFF 7, ERROR 0, TOTAL 21.
- The 7 differences were confined to `created_at` and/or `updated_at`:
  - `/v2/api/faqs/` — `created_at`
  - `/v2/api/faqs/server-side?page=1&limit=2` — `created_at`
  - `/v2/api/faqs/1` (the dynamic positive detail case) — `created_at`
  - `/v2/api/seo_pages/` — `created_at`, `updated_at`
  - `/v2/api/seo_pages/server-side?page=1&limit=2` — `created_at`, `updated_at`
  - `/v2/api/seo_pages/16` (dynamic detail) — `created_at`, `updated_at`
  - `/v2/api/seo_pages/slug/enquiry` (dynamic slug) — `created_at`, `updated_at`
- The SEO `updated_at` diagnostic reported `delta-minutes:-330` (native 330 minutes earlier).
- The positive detail IDs/slugs in this report are observed examples, not hardcoded test fixtures. The parity script uses first eligible records from your database.

## Implementation

- `src/lib/localBulk119PublicReads.ts`:
  - Formats only FAQ `created_at` and SEO `created_at`/`updated_at` as UTC ISO-8601 text in SQL, avoiding implicit mysql2 local-time-to-Date parsing.
  - Emits `null` for null/zero/incomplete dates and always 3 millisecond digits, consistent with `JSON.stringify(Date)` for ordinary valid UTC DATETIME values.
  - Applies consistently to list, details, slug lookups and admin grid SELECTs.
  - **Does not change** FAQ `updated_at`, other resource timestamps, sort order, filters, authorization, write gates, or database records.
  - Does not hardcode an IST offset. This correction is for the original Sequelize `DATETIME` UTC-date serialization pattern; retesting is required against the actual schema.
- `scripts/compare-bulk119-express-next.mjs`: adds safe delta/category diagnostics for *both* timestamp fields for list, grid and detail mismatches. No private database values are printed.
- `scripts/bulk119-date-utc-parity.test.mjs`: seven new read-only mock contract tests.
- `package.json`: includes the new tests in `npm run test:api:bulk119`.

## Tests performed in build workspace

- BULK114–119 combined source/bridge regression: **79/79 PASS** (`node --experimental-strip-types --test ...`).
- BULK119 mock/contract subset: **19/19 PASS**.
- Isolated strict TypeScript check of `localBulk119PublicReads.ts`: **PASS**.
- Live MySQL Express-vs-Next parity: **not run here** (requires the user's local DB and Next.js server).
- Full Next.js production build: **not run here** (complete Next.js dependencies unavailable in this build workspace).

## Local acceptance steps (Windows)

1. Extract the full-project ZIP into `E:\nextjs\sourceindia-next-new` while retaining `.git`, `.env.local`, `node_modules`.
2. Run `npm run test:api:bulk119` and `npm run build`.
3. Start `npm run dev` and keep it running.
4. In a second terminal, run `npm run test:api:bulk119:parity`.
5. The desired result is `MATCH=21 DIFF=0 ERROR=0 TOTAL=21`. **This is a target, not a verified result**. If any mismatch remains, share the safe field and `*_diagnostic` output.

All added/modified handlers are read-only. Original React/Express source and MySQL schema/data have not been modified.
