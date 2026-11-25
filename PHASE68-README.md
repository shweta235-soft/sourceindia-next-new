# Phase 68 – Local User Profile Read API

## New endpoint
`GET /api/local/users/me` with `Authorization: Bearer <local-token>`.

- Reads the existing `users` table directly using a parameterized, read-only query.
- Verifies the locally issued JWT, then requires that the database account still exists, is active, and has the same email and seller/buyer role.
- Returns only first/last name, email, account role, company ID, and basic contact/address/profile fields. Does not expose password, raw password, OTP, JWT, reset or mail tokens, or admin flags.
- 401 for no/invalid/expired token or account mismatch; 503 for unavailable DB/auth configuration; never discloses DB details.
- Original React/Node.js remains read-only; existing Public/Seller/Buyer/Admin login, UI and live API calls unchanged. **Local login and local profile are isolated pending database QA and UI integration.**

## Required configuration
Preserve `.env.local` and configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, optional DB_PORT and LOCAL_AUTH_JWT_SECRET from Phase 67. Do not expose these values or bearer tokens in chat.

## Tests
`node --experimental-strip-types --test tests/local-user-profile.test.mjs`
`npm ci`
`npm run build`

## Browser/API smoke test
With local DB configured, sign in via POST `/api/local/auth/login` using a dedicated test account. Call GET `/api/local/users/me` with the returned bearer token in an API client. Expect 200 and safe profile fields; without a token expect 401 (if DB configured). Never share passwords or tokens. No DB schema/data changes are required.
