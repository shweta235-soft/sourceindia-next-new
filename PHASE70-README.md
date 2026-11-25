# Phase 70: Isolated authenticated own-company read API

New `GET /api/local/companies/me` reads the **current local JWT** in the `Authorization: Bearer` header and checks that the user remains active. It then joins `users.company_id` to `company_info.company_id` and returns explicitly selected, non-secret fields. It accepts no company ID input, has no write operations, and returns 401 for invalid credentials, 404 for absent or deleted linked companies, and 503 when local configuration/database is unavailable. The API is deliberately **not** connected to the existing Company Profile UI yet.

Tests: `node --test src/lib/localCompanyProfile.test.mjs`.

Dependencies: unchanged from Phase 69. Existing `node_modules` can be reused; `npm ci` is not necessary when already installed. Build: `npm run build`.

Local authenticated API data tests still require explicit DB_* environment variables and LOCAL_AUTH_JWT_SECRET, a locally issued JWT, and access to an existing database. No schema modification or seeded records.
