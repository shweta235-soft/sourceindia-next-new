# Phase 67 – First real local API batch: password login + session verification

## New Next.js APIs (local database, no upstream proxy)
- `POST /api/local/auth/login` – `users` table lookup, legacy bcrypt `$2y$` compatibility, one-hour locally signed JWT, minimal safe response.
- `GET /api/local/auth/session` – verifies local JWT **and** queries DB to reject deleted/disabled/changed accounts.

## Safety and rollout
- Existing live Login, OTP, Admin, dashboard and UI remain **unchanged** until the local APIs are integration-tested.
- Requires `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, optional `DB_PORT=3306` and random **32+ character** `LOCAL_AUTH_JWT_SECRET` in `.env.local`. No database migrations or writes.
- Login route intentionally rejects inactive/deleted accounts. Passwords and hashes are never logged or returned.
- A persistent/distributed rate limiter and an end-to-end migration of dependent APIs are required **before** directing public login traffic here. In-memory rate limiting was not presented as secure.
- Tokens issued by the local endpoint are not recognized by the old Express APIs; this is why public UI was not switched.
- Do not use the old Express hardcoded JWT secret for LOCAL_AUTH_JWT_SECRET.

## Tests
- `node --experimental-strip-types --test tests/local-password-login.test.mjs`
- `node --test src/lib/localAuthToken.test.mjs`
- `npm ci && npm run build` (after ZIP extraction; dependency installation needs network access)
- Local DB smoke test using a dedicated test account: POST valid/invalid credentials, then GET session using returned bearer token. Never share tokens.

## Reference inspected read-only
Original backend `controllers/usersController.js` (`login`), `models/Users.js`, `middleware/authMiddleware.js`, `config/database.js`. Note: original login issued 1h tokens; local issuer has its own issuer/audience/secret.
