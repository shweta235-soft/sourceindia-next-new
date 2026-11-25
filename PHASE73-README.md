# Phase 73 — Local Seller Product Listing API

New opt-in endpoint: `GET /api/local/products/me?page=1&limit=20`.

- Authentication: `Authorization: Bearer <LOCAL JWT>` issued by `/api/local/auth/login`.
- Requires active seller account and linked company.
- Returns seller-owned, non-deleted products only. Includes draft and unapproved products because this is the seller's private list, not the public product catalog.
- Strict numeric pagination: defaults to page 1, limit 20, maximum 50.
- Read-only. Does not modify the original React project, live API, database schema, or existing UI connection.
- Tests: `node --test src/lib/localSellerProducts.test.mjs` with Node 24, or Node 22 with `--experimental-strip-types`.
- Status: targeted unit tests pass. Database integration and `npm run build` must be verified in the configured local environment.

The new local API is intentionally isolated pending local MySQL/JWT integration tests. The existing Seller Dashboard still uses its live API.
No new npm dependencies in this phase. Preserve your existing `.env.local` during extraction; run `npm run build` only.
