# Phase 59 — Local authentication cryptographic foundation (not yet live login)

Baseline: Phase 58 full project ZIP. Reference inspected read-only: sourceindia-main-new/backend/controllers/usersController.js and middleware/authMiddleware.js.

## Delivered
- `src/lib/localAuthToken.ts`: HS256 issuer/verifier for **new local Next.js tokens only**. Requires a non-placeholder secret of at least 32 bytes, explicit numeric account IDs and seller role, 1h expiry, `iss` and `aud` validation, and timing-safe signature checks. Pure library; no route invokes token issuance yet.
- `tests/local-auth-token.test.mjs`: tests for issue/verify, expiry, invalid secret, invalid claims, wrong key, and tampering.
- No new dependency, database access, schema modification, token issuance endpoint, or behavioral change to existing live-login UI.

## Original React/Express compatibility issues
- Legacy password login signs with the literal hardcoded `your_jwt_secret_key`, and legacy auth middleware verifies that value. Next.js must **never** copy or accept it as a new signing secret.
- Legacy password hash verification uses bcrypt with PHP `$2y$` -> `$2a$` normalization. Local DB-backed login will require bcryptjs/bcrypt compatibility, existing users' status checks, failure-rate limiting, and database connection verification.
- Existing live tokens and the new local tokens have intentionally different trust boundaries; switching the UI to the new issuer before all affected routes agree on verification would break existing sessions.
- The reference controller logs passwords and bcrypt hashes. Do not copy this behavior.

## Next implementation gate
1. Confirm the exact database connection + users schema/model field mappings without exposing passwords or secrets.
2. Install/test bcrypt compatibility and configure a server-only secret (for example `LOCAL_AUTH_JWT_SECRET`) with cryptographically random bytes; never use a default in production.
3. Add consistent login failure limits / anti-enumeration measures and per-user active/deleted checks, then test local password login with a dedicated test account.
4. Migrate profile/session and downstream account APIs to verify local tokens **before** switching the UI. Keep legacy tokens working only through the existing upstream boundary until cutover.
5. OTP needs a separate, replay-safe expiry/attempt-limit store and provider integration. No DB changes without prior approval.

## Verification
`node --experimental-strip-types --test tests/account-session.test.mjs tests/local-auth-token.test.mjs`
All 7 tests passed in packaging environment. `npm run build` not run here: no Next.js node_modules in extracted project. User should run it in existing Windows project, where dependencies are installed.
