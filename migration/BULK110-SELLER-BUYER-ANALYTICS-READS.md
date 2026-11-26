# Bulk110 — Seller and Buyer read API consolidation

Date: 2026-11-26. Compared with the **original Express source** in the user's provided read-only reference ZIP (`backend/routes/sellerRoutes.js`, `backend/routes/buyerRoutes.js`, and corresponding controllers/Sequelize models). **The original React/Express ZIP was not modified.**

## Newly implemented signed-Admin GETs (11)

| Local Next.js GET path (prefix `/admin/api/local`) | Original Express route | Notes |
|---|---|---|
| `/sellers/trends` | `GET /v2/api/sellers/trends` | Grouped trend counts by day/month/year; valid ranges capped |
| `/sellers/chart` | `GET /v2/api/sellers/chart` | Status counts, `type=ALLACTIVE` projection |
| `/sellers/seller-categories` | `GET /v2/api/sellers/seller-categories` | Active, non-deleted category names/IDs/slugs |
| `/sellers/seller-subcategories` | `GET /v2/api/sellers/seller-subcategories` | Validated `category_id`, normalized rows |
| `/sellers/seller-subcategories-by-user` | `GET /v2/api/sellers/seller-subcategories-by-user` | Requires `user_id` and `category_id`; source controller does not constrain result to user |
| `/sellers/with-messages` | `GET /v2/api/sellers/with-messages` | Distinct seller-message user IDs |
| `/sellers/seller-message/[userId]` | `GET /v2/api/sellers/seller-message/:user_id` | Read single seller message with limited user projection |
| `/sellers/designations` | `GET /v2/api/sellers/designations` | Optional `status=0/1` |
| `/sellers/nature_business` | `GET /v2/api/sellers/nature_business` | Reference list |
| `/buyers/chart` | `GET /v2/api/buyers/chart` | Buyer status counts |
| `/buyers/get-buyer-sourcing-interests` | `GET /v2/api/buyers/get-buyer-sourcing-interests` | Required `user_id`, grouped item categories/subcategories |

All endpoints are **GET only**. Signed Admin authentication is required before any database access. SQL uses fixed tables/columns and bound parameters. No `SELECT *` from users; no passwords, OTPs, session tokens, email sending, file uploads, delete or update statements. All tables queried retain existing schema/data.

### Intentional deviations / verification pending

- Legacy charts could default to **all history**, which can cause long-running daily aggregation; this version defaults to 30 days (charts/day trends), 12 months or five years and caps explicitly supplied ranges (maximum 366 days). It is therefore **not exact Express behavioral parity**.
- Reference lists and sourcing queries cap result size at 5,000 rows (seller messages at 10,000 IDs); original controller may be unbounded.
- Original `getSellerSubCategories` incorrectly checks flattened `subcategory.id` properties of raw rows; this version returns normalized subcategory rows instead of silently empty results.
- Original `getSellerSubCategoriesByUser` requires a user ID but **does not filter by it**; this version preserves that behavior rather than falsely claiming user-owned records.
- Admin-only routes are intentionally more restrictive than several originally unprotected Express endpoints. The public/user dashboard integration is **not** established by adding these Admin GETs.
- No attempt has been made to enable write workflows or claim real DB/test-data response parity.

### Verification

- `npm run test:api:bulk110` — 16 pure/source/mock tests; no MySQL (requires installed `typescript`).
- `npm run api:matrix:bulk110` — exhaustive 516-registration **static shape** matrix; every row has `parity_verified=false`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk110.ps1` — contracts, inventory, **9-table read-only `INFORMATION_SCHEMA` check**, signed Admin GETs. User must run on Windows with `npm run dev` already running and local `.env.local` configured.
- `npm run build` — required on Windows; full production build cannot be certified from the isolated tool environment.

The exhaustive worklist contains remaining unmatched registrations and risks, including all write, mail, upload, auth, and tracking flows.
