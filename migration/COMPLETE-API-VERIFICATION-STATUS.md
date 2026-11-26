# Bulk109 checkpoint (26 November 2026) — read-only Admin expansion

42 new Admin GET exports across seven modules; signed-cookie auth, no credentials/OTP in SQL projections, ticket role/category scoping. Original Express registrations 516, local exports 362, static route candidates 216. Full behavioral parity remains UNVERIFIED, actual MySQL read checks and production build are user-side pending. No database writes. See `BULK109-READ-API-STATUS.md` and `reports/full-api-migration-worklist.csv`.

---

# Consolidated API Migration — Accurate Status (26 November 2026)

## User objective

Migrate **all** original SourceIndia React/Express APIs to Next.js with correct business logic and one consolidated project. **This objective is still incomplete.** Creating route exports or passing static/mock checks does not establish working parity.

## Source-of-truth counts

- Original Express method/path registrations: **516** (includes aliases / multiple registrations).
- Current Next.js local HTTP method exports across the entire project: **320**.
- Static Express-to-local matching method/path candidates: **195**.
- Legacy registrations without a matching method/path candidate: **321**.
- Fully verified Express API functional equivalents through the automated inventory: **0 asserted**.
- Exact per-route status and conservative risk classification: `reports/full-api-migration-worklist.csv` and `.json`.

Counts reflect code shape, not business parity, and do not assume API exports are a one-to-one subset of Express registrations.

## New implementation included here

### Signed Admin content APIs

- `email-templates`: list, count, server-side search/sort, detail with decoded email message, create, edit, and clone; physical deletion is **blocked**.
- `newsletter-circulars`: list, count, server-side search/sort, user category lookup, detail with image metadata, edit; multipart create/images and physical delete are **blocked** pending verified storage workflow.
- `registrations`: Admin list/count/server-side search, joined state/city names, detail; reversible `is_delete` updates and selected soft-delete (up to 50 IDs) behind an opt-in write flag; physical deletion **blocked**.

### Signed Admin reports

- `newsletter-histories`: read-only counts and server-side list, including the original `newsLatter_id` filter.
- `user-activity`: read-only list/count/server-side and by-user details with Admin-only join fields.
- `category-conflict-logs`: read-only server-side search and pagination.

These endpoints use explicit original Sequelize model table/column definitions, parameterized SQL and field allowlists; avoid raw SQL identifiers derived from user requests.

## Safety and verification

- Existing public pages, Seller/Buyer flows, Admin UI, previous APIs and MySQL schema/data are **not intentionally changed** by this ZIP.
- All new data-mutating Admin content operations require a signed Admin session, matching Origin and `LOCAL_ADMIN_BULK108_WRITES_ENABLED=true` (off by default). **Never enable against a shared or production database.**
- This flag is **not** an endorsement to run actual writes: validate on isolated throwaway MySQL with known safe fixtures and mock outbound email/uploads first.
- Hard deletes, newsletter multipart uploads, email delivery, email resends, open-tracking mutations, OTP and payments remain **unimplemented / blocked** in this phase; no placeholder 200 responses are used for these.
- New field/route contract tests and signed HTTP mock pass; full Windows `npm run build`, live MySQL API responses, write execution, and equivalence to every original Express controller were **not verified** here.
- Read-only live schema preflight is provided for the additional tables. It will truthfully fail if a required table or column does not exist; never auto-migrates schema.

## Run on Windows

1. Extract complete project ZIP over `E:\nextjs\sourceindia-next-new`, preserving `.git` and `.env.local`. The ZIP does not include secrets or Git metadata. Back up project before overwriting.
2. In PowerShell: `npm run build`
3. In PowerShell terminal A: `npm run dev`
4. In terminal B: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk108.ps1`
5. Confirm `BULK108 COMBINED RESULTS: PASS`. Test reads and wrong-origin or **invalid** mutation probes only; never attempts a valid Admin write.

If live schema verification fails, do not add tables or modify production DB automatically. Report only the failing table/column list and the test output for reconciliation.
