# Phase 60 — Harden Admin session issuance response validation

Baseline: Phase 59 full-project ZIP, with all public and user dashboard code preserved.

- Added `src/lib/adminLoginValidation.ts` with isolated upstream admin-id and JWT-expiry shape validation.
- Updated `src/app/api/admin-session/route.ts` to reject malformed upstream identities and token expiry metadata before creating a signed, HttpOnly admin session cookie.
- Added `tests/admin-login-validation.test.mjs` with positive and negative cases.
- No client-visible UI change, no API endpoint switch, no local database changes, no dependency changes.
- IMPORTANT: The expiry parser is **not** an upstream JWT signature verifier. The admin login endpoint remains the trusted server-to-server source; this phase is validation hardening, not a new authentication mechanism.

Run tests: `node --experimental-strip-types --test tests/*.test.mjs` on Node 24. Run `npm run build` in the existing Windows Next.js project after replacing it. Credentials and .env.local are not included in the ZIP.
