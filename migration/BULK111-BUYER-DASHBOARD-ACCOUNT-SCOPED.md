# Bulk111 — Buyer dashboard local account APIs

**Source reviewed:** the original read-only SourceIndia reference ZIP: `backend/routes/usersDashboardRoutes.js`, `backend/controllers/userDashbordController.js`, the associated Sequelize models, and `frontend/src/pages/Dashboard.jsx`. Original source was **not modified**. This package preserves the existing Next.js public, Seller, Buyer, and Admin UI; the existing UI is **not silently redirected** to the new local routes.

## 8 newly exported methods (6 GET, 2 POST)

| Next.js local path | Original Express route | Status / deviations |
|---|---|---|
| `GET /api/local/dashboard/buyer-interest` | `GET /v2/api/dashboard/buyer-interest` | Buyer JWT required; capped categories + subcategory hierarchy |
| `GET /api/local/dashboard/get-buyer-interest` | `GET /v2/api/dashboard/get-buyer-interest` | Returns `categories`, `subCategories`, `checked` for the **signed-in buyer only** |
| `GET /api/local/dashboard/get-itemtype` | `GET /v2/api/dashboard/get-itemtype` | React hierarchy and selected sourcing counts; fixed bounded SQL queries |
| `GET /api/local/dashboard/get-item-subcategory?categoryId=...` | `GET /v2/api/dashboard/get-item-subcategory` | Checked subcategories + count; ownership derived from JWT |
| `GET /api/local/dashboard/get-products` | `GET /v2/api/dashboard/get-products` | At most 10 approved, active products matched by actual category/subcategory pairs; ordered by newest ID, **not legacy random order** |
| `GET /api/local/dashboard/get-seller-company` | `GET /v2/api/dashboard/get-seller-company` | At most 100 product-matched companies; **not exact legacy substring matching** (original controller references absent `CompanyInfo.sub_category` field) |
| `POST /api/local/dashboard/store-buyer-interest` | `POST /v2/api/dashboard/store-buyer-interest` | Buyer-only transaction; replace selected interest categories/subcategories, **disabled by default** |
| `POST /api/local/dashboard/store-item-subcategory` | `POST /v2/api/dashboard/store-item-subcategory` | Buyer-only transaction; add/remove/replace sourcing, **disabled by default** |

### Security and business integrity

- JWT must be issued by `/api/local/auth/login` using `LOCAL_AUTH_JWT_SECRET`. Live Express tokens are not interchangeable.
- Authenticated `is_seller=0` buyer and current active/nondeleted user row are required. If `userId` is supplied, it **must equal** the token subject. No cross-account reads or writes. GETs never expose user passwords, hashes, OTPs or raw tokens.
- Query ID, supported parameters, JSON payload shape and per-request sizes are bounded. SQL identifiers are fixed in source and request values are parameterized.
- The two writes require `LOCAL_BUYER_DASHBOARD_WRITES_ENABLED=true` **only in a disposable local test database**. This is *not* included in `.env.example`, and default behavior is deny/503. Writes require signed buyer and same origin; rows are rechecked/locked and modified atomically, with rollback on failure. No emails, uploads or schema changes.
- **Do not turn on the write flag against existing production/shared data.** The combined script never issues valid same-origin POST writes even if accidentally enabled.
- Source routes were not authentication protected by Express middleware; this implementation intentionally tightens access controls. Output fields and product/company match ordering may differ, therefore full Express parity is **not** claimed.

### Verification

- `npm run test:api:bulk111`: pure contracts and in-memory HTTP/transaction mocks (including commit/rollback), no live DB.
- `npm run api:inventory && npm run api:matrix:bulk111 && npm run api:full-worklist`: 516-row inventory, static candidates only, no parity assertions. To refresh the Bulk111 worklist run `node scripts/full-api-worklist.mjs --bulk111`.
- `node scripts/test-local-bulk111-db-preflight.mjs`: inspect **12 tables** in `INFORMATION_SCHEMA` only; does not write.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk111.ps1`: combines source tests, inventory, live schema metadata, **buyer login + buyer-owned GETs + rejected POST probes**. Existing Next dev server on localhost:3000 and a valid local Buyer account required. No valid writes are attempted.
- `npm run build`: must be run on the user's fully installed Windows project. Full build has not been independently verified in the isolated work container.

**Progress after Bulk111:** 516 legacy registrations; 381 local HTTP exports; 235 static matching method/path candidates; 281 legacy registrations still without static matches. This is not a count of fully functionally migrated endpoints. All 516 matrix rows retain `parity_verified=false`.
