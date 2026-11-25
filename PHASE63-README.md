# Phase 63 — Account login redirect regression checks

- Extracted the account login redirect allowlist to `src/lib/accountLoginRedirect.ts`.
- Seller and buyer both enter `/dashboard`; existing `AccountShell` and `UserDashboard` select the account-specific view from `user.is_seller`.
- Preserved supported deep-link `returnTo` paths and rejected unknown or external destinations.
- No database, API contract, public UI, or admin auth modifications.

## Checks

```powershell
node --test tests/account-login-redirect.test.mjs
npm run build
```

Then verify seller and buyer logins, direct `/dashboard` refresh, logout, and supported login `returnTo` links. Existing `.env.local` should be preserved when applying the archive. Full production build requires installing dependencies and is not asserted by this package.
