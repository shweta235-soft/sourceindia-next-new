# Phase 58 — Authentication contract and first account API boundary

Baseline: Phase 57 full project ZIP. Reference: original `sourceindia-main-new/backend/routes/usersRoutes.js`, `controllers/usersController.js`, and `middleware/authMiddleware.js`, inspected read-only on 23 November 2026.

## Delivered

- New `GET /api/account/session`: checks a syntactically valid Bearer header, asks the configured existing Express auth service to validate it via `GET /signup/profile`, and returns a **narrow, password/OTP-free** profile projection.
- `src/lib/accountSession.ts`: explicit authorization-header validation, safe HTTPS-or-loopback upstream base URL validation, and allowlist-based response projection.
- `tests/account-session.test.mjs`: no real token, database, mail service, or user records required. Run with `node --experimental-strip-types --test tests/account-session.test.mjs` (Node 22+); three tests.
- Existing login/password/OTP UI and endpoints are deliberately unchanged. This prevents a risky untested switch to a new token issuer.

## Source-confirmed original contracts

| Original HTTP route (mounted under `/v2/api/users` and/or `/v2/api/signup`) | Input | Success shape | Access |
|---|---|---|---|
| `POST /login` | `{email,password}` | `{message,token,user:{id,fname,lname,email,is_seller}}` | Public credential verification |
| `POST /send-login-otp` | `{email}` | `{success:1,message,user,userId}` where `userId` is base64-encoded legacy numeric identifier | Public OTP issue |
| `POST /verify-login-otp` | `{userId,otp}` | `{message,token,user}` | Public OTP verification |
| `GET /profile` | Bearer JWT | `{user}` including nested company and location records | `authMiddleware` |
| `POST /change-password` | Bearer JWT and password fields | See controller for exact responses | `authMiddleware` |
| `POST /impersonate-login` | Legacy token input | Not yet approved for migration | Public legacy route — **do not enable** |

## Security findings / migration blockers

1. Legacy password login issues JWTs using a hardcoded signing key. OTP verification uses `process.env.JWT_SECRET ||` that same hardcoded key. Legacy middleware verifies against the hardcoded key, so an environment-specific key could make OTP tokens incompatible with profile verification. **Do not replicate the hardcoded key into Next.js.** Separate secret migration and rotation plan needed.
2. Legacy password login logs plaintext password and stored hash in the controller. Treat that as a high-priority source vulnerability; do not copy those logs and do not modify the read-only reference.
3. The existing Next.js UI still holds bearer tokens in browser localStorage and calls live Express auth endpoints directly. Phase 58's API boundary is additive, **not** a complete local auth migration or session-cookie rollout.
4. The new endpoint does not create sessions, write to DB, issue OTPs, or change passwords. It declines untrusted upstream response shapes, strips any `password`, `real_password`, `otp`, or other private fields, and never caches sensitive responses.
5. Before implementing locally stored credentials/OTP, confirm DB schema/connection settings without copying secrets, define migration for existing JWTs/sessions, rate limiting, replay prevention, OTP expiry and hashing, and negative authorization tests.

## Acceptance and testing

- `node --experimental-strip-types --test tests/account-session.test.mjs` — passed (3/3) in the packaging environment.
- Manual authenticated smoke test (with existing buyer/seller test token only, never paste token into chat): call `GET /api/account/session` with `Authorization: Bearer <token>`; expect HTTP 200 and `{user: ...}` without password/OTP fields. Without a token, expect HTTP 401. If existing live API cannot be reached, expect HTTP 502.
- `npm run build` not verified here because project node_modules are absent and package installation has not been completed. Run this after extracting the full ZIP into the existing project; no reinstall needed if existing dependencies are present.

## Recommended Phase 59

Implement local authentication service **only after confirming safe DB credentials/connection and the token/OTP contract**: password hash verification, credential-independent throttling, consistent JWT signer/verifier, and account status checks. Explicitly keep password reset and account impersonation separately gated.
