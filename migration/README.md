# SourceIndia migration records

The cumulative snapshot preserves `phase57-express-endpoints.csv` (legacy registrations), `phase57-next-route-handlers.csv`, and machine-generated reports in `reports/`. `BULK87-API-STATUS.md` and audit JSON retain early migration inventory context. Refer to these for mapping and ongoing parity checks.

Old root-level `BULK*` and `PHASE*` fix notes were intentionally removed from the delivered ZIP to avoid retaining dozens of obsolete batch instructions. All application source, scripts, and migration inventories have been retained. This cleanup does not remove the same files from an existing user's working directory when merely extracting a ZIP over it; use Git to review before removing obsolete files locally.

Bulk103: added 11 read-only HTTP routes across interest subcategories and Admin shortcut menus; no database writes or schema changes. Admin shortcut menus remain private (some links may be operational/admin-only). Full parity and authenticated runtime reads are not yet confirmed.

## Bulk105 authenticated read verification (safe preflight)

Bulk105 adds `scripts/test-local-bulk105.ps1`, a combined Windows runner for source/mock tests, MySQL schema preflight, and signed-Admin **read-only** API tests. `scripts/bulk105-contracts.mjs` is the explicit 15-module smoke-test inventory. `scripts/bulk105-schema.mjs` maps 19 MySQL tables and required columns; schema preflight reads `INFORMATION_SCHEMA.COLUMNS` only. It does not perform DML/DDL or return customer records. Actual Admin credentials and DB are available only in the user's Windows environment; their live PASS statuses are pending until run there. Cross-origin POST checks are rejected before write flags or SQL are reached. This does not verify writes, uploads, email delivery, frontend-to-API rewiring or Express business parity.

## Bulk106 consolidated Admin read/status extension

Bulk106 adds **60 signed-Admin GET routes** across 15 original Sequelize-backed modules and **10 optional status PATCH routes**. All Bulk106 writes are default-off, not tested against real data, and explicitly excluded from automatic authenticated tests. The `scripts/test-local-bulk106.ps1` runner checks pure code contracts, 15 MySQL table/column dependencies through `INFORMATION_SCHEMA`, 60 Admin read/validation requests, signed session and 20 safe write-block checks. It does not perform SQL writes. User-provided Bulk105 results showed 19/19 schema checks and 67/67 authenticated reads; Bulk106 runtime results are not yet known.

The per-registration candidate matrix now has a Bulk106 variant in `reports/bulk106-endpoint-matrix.{csv,json,md}`, generated with `npm run api:matrix:bulk106`. It retains all **516 rows** with `parity_verified: false`. A model-backed CRUD resource is not automatically an equivalent Express endpoint. Historical Bulk104 matrix files are preserved unchanged.
